"""Render a script.json's narration into narration.wav + timings.json for the video.

A provider is a plain function synthesize(text, voice, speed) -> (float32 mono samples, sample_rate, words | None),
word times in seconds relative to the clip. Adding a provider = one function + one PROVIDERS entry.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

REPO = Path(__file__).resolve().parents[1]
LEAD_IN = 0.12
MARGIN = 0.1

_pipelines = {}


def kokoro(text, voice, speed):
    from kokoro import KPipeline

    lang = voice[0]
    if lang not in _pipelines:
        _pipelines[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
    chunks, words, offset = [], [], 0.0
    for r in _pipelines[lang](text, voice=voice, speed=speed):
        if r.audio is None:
            continue
        chunks.append(r.audio.numpy())
        new_word = True
        for t in r.tokens or []:
            if new_word:
                words.append({"text": "", "start": None, "end": None})
            w = words[-1]
            w["text"] += t.text
            if t.start_ts is not None and t.end_ts is not None and re.search(r"\w", t.text):
                w["start"] = offset + t.start_ts if w["start"] is None else w["start"]
                w["end"] = offset + t.end_ts
            new_word = bool(t.whitespace)
        offset += len(chunks[-1]) / 24000
    words = [w for w in words if w["start"] is not None]
    return np.concatenate(chunks).astype(np.float32), 24000, words or None


def say(text, voice, speed):
    """macOS `say`: zero-download fallback, no word timings. Uses the system voice unless `voice` is a say voice."""
    text = re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", text)
    listing = subprocess.run(["say", "-v", "?"], capture_output=True, text=True).stdout
    args = ["-v", voice] if voice in {re.split(r"\s{2,}", l)[0] for l in listing.splitlines()} else []
    if speed != 1:
        args += ["-r", str(round(175 * speed))]
    with tempfile.TemporaryDirectory() as d:
        (Path(d) / "in.txt").write_text(text)
        subprocess.run(["say", *args, "-f", f"{d}/in.txt", "-o", f"{d}/out.aiff"], check=True)
        samples, sr = sf.read(f"{d}/out.aiff", dtype="float32")
    return samples, sr, None


PROVIDERS = {"kokoro": kokoro, "say": say}


def write_normalised(track, sr, path):
    """Loudnorm to -19 LUFS / -2 dBTP at 48 kHz via ffmpeg (two-pass); peak-normalise if ffmpeg is missing."""
    peak = float(np.abs(track).max(initial=0))
    if peak == 0 or not shutil.which("ffmpeg"):
        if peak:
            print("note: ffmpeg not on PATH; peak-normalised to -1 dBFS instead of loudnorm")
            track = track * (10 ** (-1 / 20) / peak)
        sf.write(path, track, sr, subtype="PCM_16")
        return sr
    with tempfile.TemporaryDirectory() as d:
        raw = f"{d}/raw.wav"
        sf.write(raw, track, sr, subtype="FLOAT")
        ln = "loudnorm=I=-19:TP=-2:LRA=11"
        p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af", ln + ":print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True, check=True)
        m = json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])
        ln += (f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
               f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", ln,
                        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(path)], check=True)
    return 48000


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("script", type=Path)
    ap.add_argument("--provider", choices=PROVIDERS)
    ap.add_argument("--out-dir", type=Path)
    a = ap.parse_args()

    spec = json.loads(a.script.read_text())
    v = spec.get("voice", {})
    name = a.provider or v.get("provider", "kokoro")
    if name not in PROVIDERS:
        sys.exit(f"unknown provider {name!r}; available: {', '.join(PROVIDERS)}")
    out_dir = a.out_dir or REPO / "public" / "episodes" / spec["id"]

    clips, errors, rate = [], [], None
    for b in spec["beats"]:
        text = (b.get("narration") or "").strip()
        if not text:
            continue
        samples, sr, words = PROVIDERS[name](text, v.get("voice", "af_heart"), v.get("speed", 1.0))
        if rate not in (None, sr):
            sys.exit(f"provider {name} returned mixed sample rates ({rate}, {sr})")
        rate, dur, slot = sr, len(samples) / sr, b["seconds"] - MARGIN
        print(f"{b['id']}: {dur:.2f}s of speech in a {b['seconds']:.2f}s beat")
        if LEAD_IN + dur > slot:
            errors.append(f"beat {b['id']!r}: {dur:.2f}s speech + {LEAD_IN}s lead-in = {LEAD_IN + dur:.2f}s"
                          f" exceeds its slot of {b['seconds']:.2f}s - {MARGIN}s = {slot:.2f}s")
        clips.append((b, samples, dur, words))
    if errors:
        sys.exit("narration does not fit the video timing:\n  " + "\n  ".join(errors))

    rate = rate or 48000
    total = max(b["start"] + b["seconds"] for b in spec["beats"])
    track = np.zeros(round(total * rate), np.float32)
    for b, samples, _, _ in clips:
        i = round((b["start"] + LEAD_IN) * rate)
        track[i:i + len(samples)] += samples

    out_dir.mkdir(parents=True, exist_ok=True)
    rate = write_normalised(track, rate, out_dir / "narration.wav")
    ms = lambda b, t: round((b["start"] + LEAD_IN + t) * 1000)
    timings = {"audio": "narration.wav", "sampleRate": rate, "beats": [
        {"id": b["id"], "start": round(b["start"] + LEAD_IN, 3), "audioSeconds": round(dur, 3),
         "words": None if words is None else
         [{"text": w["text"], "startMs": ms(b, w["start"]), "endMs": ms(b, w["end"])} for w in words]}
        for b, _, dur, words in clips]}
    (out_dir / "timings.json").write_text(json.dumps(timings, indent=2) + "\n")
    print(f"wrote {out_dir}/narration.wav ({total:.2f}s @ {rate} Hz) + timings.json")


if __name__ == "__main__":
    main()
