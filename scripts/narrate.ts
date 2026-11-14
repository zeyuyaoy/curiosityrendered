import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { FPS, toTimeline } from "../src/episode/timeline";
import { arg, fail, loadSpec, outDir, positional, publicDir, ROOT } from "./lib";

const [id] = positional();
if (!id) fail("usage: pnpm narrate <episode-id> [--provider say]");
const { spec } = loadSpec(id);
const voice = { provider: "kokoro", voice: "af_heart", speed: 1, lexicon: {}, ...spec.voice };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const speak = (s: string) =>
  Object.entries(voice.lexicon as Record<string, string>).reduce(
    (t, [from, to]) => t.replace(new RegExp(`(?<![\\w*])${esc(from)}(?![\\w*])`, "g"), to),
    s,
  );

const { beats } = toTimeline(spec.beats);
const script = {
  id,
  voice: { provider: voice.provider, voice: voice.voice, speed: voice.speed },
  beats: beats.map((b) => ({ id: b.id, start: b.from / FPS, seconds: b.duration / FPS, narration: speak(b.narration) })),
};
mkdirSync(outDir(id), { recursive: true });
const scriptPath = path.join(outDir(id), "script.json");
writeFileSync(scriptPath, JSON.stringify(script, null, 2));

const provider = process.argv.includes("--provider") ? process.argv[process.argv.indexOf("--provider") + 1] : undefined;
const py = spawnSync("uv", ["run", "--project", "tts", "python", "tts/narrate.py", scriptPath, ...(provider ? ["--provider", provider] : [])], {
  cwd: ROOT,
  stdio: "inherit",
});
if (py.status !== 0) fail("narration failed (see above)");

const t = JSON.parse(readFileSync(path.join(publicDir(id), "timings.json"), "utf8")) as {
  beats: { id: string; words: unknown[] | null }[];
};
for (const b of t.beats) {
  const shown = beats.find((x) => x.id === b.id)!.narration.split(/\s+/).filter(Boolean).length;
  if (b.words && b.words.length !== shown)
    console.warn(`warn  ${b.id}: ${b.words.length} spoken tokens vs ${shown} caption words; captions will show spoken text`);
}
if (!arg("quiet")) console.log(`✔ narration ready in public/episodes/${id}/`);
