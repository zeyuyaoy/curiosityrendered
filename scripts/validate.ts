import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { brand } from "../src/brand/tokens";
import { fail, outDir, positional } from "./lib";

const probe = (file: string) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffprobe failed on ${file}: ${r.stderr}`);
  return JSON.parse(r.stdout) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number; r_frame_rate?: string; pix_fmt?: string; nb_frames?: string }[];
    format: { duration: string };
  };
};
const ffmpegLog = (file: string, filter: string) =>
  spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-filter_complex", filter, "-f", "null", "-"], { encoding: "utf8" }).stderr;

export const validateExport = (id: string) => {
  const dir = outDir(id);
  const problems: string[] = [];
  const need = ["reel.mp4", "cover.png", "caption.txt", "transcript.srt", "manifest.json"];
  for (const f of need) if (!existsSync(path.join(dir, f))) problems.push(`missing ${f}`);
  if (problems.length) return problems;

  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const reel = path.join(dir, "reel.mp4");
  const { streams, format } = probe(reel);
  const v = streams.find((s) => s.codec_type === "video");
  const a = streams.find((s) => s.codec_type === "audio");
  const { width, height, fps } = brand.video;
  if (!v) problems.push("no video stream");
  else {
    if (v.width !== width || v.height !== height) problems.push(`resolution ${v.width}x${v.height}, want ${width}x${height}`);
    if (v.r_frame_rate !== `${fps}/1`) problems.push(`frame rate ${v.r_frame_rate}, want ${fps}/1`);
    if (v.codec_name !== "h264") problems.push(`video codec ${v.codec_name}, want h264`);
    if (v.pix_fmt !== "yuv420p") problems.push(`pixel format ${v.pix_fmt}, want yuv420p`);
    if (Number(v.nb_frames) !== manifest.video.durationInFrames)
      problems.push(`${v.nb_frames} frames, manifest says ${manifest.video.durationInFrames} (incomplete render?)`);
  }
  if (!a) problems.push("no audio stream");
  else if (a.codec_name !== "aac") problems.push(`audio codec ${a.codec_name}, want aac`);
  const seconds = Number(format.duration);
  if (seconds < 3 || seconds > 90) problems.push(`duration ${seconds}s outside 3-90s`);

  if (a && manifest.narration) {
    const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(ffmpegLog(reel, "[0:a]ebur128=framelog=quiet"))?.[1]);
    if (!(lufs > -18 && lufs < -13)) problems.push(`integrated loudness ${lufs} LUFS, want about -16 (-18..-13)`);
  }
  const black = ffmpegLog(reel, "[0:v]blackdetect=d=0.5:pix_th=0.04");
  if (/black_start/.test(black)) problems.push(`black frames detected: ${black.match(/black_start:\S+ black_end:\S+/g)?.join(", ")}`);

  const png = readFileSync(path.join(dir, "cover.png"));
  if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) problems.push("cover.png is not 1080x1920");
  const caption = readFileSync(path.join(dir, "caption.txt"), "utf8");
  if (caption.length > 2200) problems.push(`caption.txt is ${caption.length} chars (Instagram max 2200)`);
  if (/\{[\w.]+\}/.test(caption)) problems.push("caption.txt has an unfilled {placeholder}");
  const ends = [...readFileSync(path.join(dir, "transcript.srt"), "utf8").matchAll(/--> (\d+):(\d+):(\d+),(\d+)/g)];
  const lastEnd = ends.length ? ends.map(([, h, m, s, ms]) => +h * 3600 + +m * 60 + +s + +ms / 1000).at(-1)! : 0;
  if (manifest.narration && !ends.length) problems.push("transcript.srt is empty");
  if (lastEnd > seconds) problems.push(`transcript ends at ${lastEnd}s, after the video (${seconds}s)`);
  return problems;
};

if (import.meta.main ?? process.argv[1]?.endsWith("validate.ts")) {
  const [id] = positional();
  if (!id) fail("usage: pnpm validate <episode-id>");
  const problems = validateExport(id);
  if (problems.length) fail(`${id} export has ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
  console.log(`\u2714 output/${id}/ passes delivery checks`);
}
