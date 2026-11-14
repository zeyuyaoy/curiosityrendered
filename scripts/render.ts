import { serializeSrt } from "@remotion/captions";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { coverFrame } from "../src/brand/stills";
import { brand } from "../src/brand/tokens";
import type { EpisodeInput } from "../src/episode/schema";
import { buildCaptions, toPages, type Timings } from "../src/episode/captions";
import { resolveEpisode } from "../src/episode/resolve";
import { simulateMonty } from "../src/sims/monty";
import { arg, bundled, fail, loadSpec, missingAssets, outDir, positional, publicDir, ROOT } from "./lib";
import { validateExport } from "./validate";

const [id] = positional();
if (!id) fail("usage: pnpm render <episode-id> [--preview] [--debug]");
const preview = arg("preview");
const { raw, spec } = loadSpec(id);
const narrated = spec.beats.some((b) => b.narration);
const missing = missingAssets(id, narrated, spec);
if (missing.length && !preview) fail(`missing assets:\n  ${missing.join("\n  ")}`);
for (const m of missing) console.warn(`warn  ${m} (preview continues)`);

const dir = outDir(id);
mkdirSync(dir, { recursive: true });
console.log("bundling\u2026");
const serveUrl = await bundled();
const inputProps = { spec: raw, timings: null, debug: arg("debug") };
const composition = await selectComposition({ serveUrl, id, inputProps });

let last = -1;
const settings = { codec: "h264", crf: 16, pixelFormat: "yuv420p", audioCodec: "aac", audioBitrate: "192k", x264Preset: "slow" } as const;
await renderMedia({
  composition,
  serveUrl,
  inputProps: composition.props,
  outputLocation: path.join(dir, preview ? "preview.mp4" : "reel.mp4"),
  scale: preview ? 0.5 : 1,
  ...settings,
  ...(preview ? { crf: 23, x264Preset: "veryfast" as const } : {}),
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 10) * 10;
    if (pct !== last) process.stdout.write(`${(last = pct)}% `);
  },
});
console.log();
if (preview) {
  console.log(`\u2714 output/${id}/preview.mp4`);
  process.exit(0);
}

const cover = await selectComposition({ serveUrl, id: `${id}-cover`, inputProps: { spec: raw } });
await renderStill({ composition: cover, serveUrl, output: path.join(dir, "cover.png"), inputProps: { spec: raw }, frame: coverFrame(raw as EpisodeInput) });

const resolved = resolveEpisode(spec);
const timingsPath = path.join(publicDir(id), "timings.json");
const timings: Timings | null = existsSync(timingsPath) ? JSON.parse(readFileSync(timingsPath, "utf8")) : null;
const pages = toPages(buildCaptions(resolved.timeline.beats, timings));
writeFileSync(path.join(dir, "transcript.srt"), serializeSrt({ lines: pages.map((p) => p.words.map((w, i) => ({ ...w, text: (i ? " " : "") + w.text }))) }));
writeFileSync(path.join(dir, "caption.txt"), `${resolved.spec.post.caption}\n\n${resolved.spec.post.hashtags.join(" ")}\n`);

const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const git = (cmd: string) => {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};
const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const simulation = "sim" in spec ? spec.sim : null;
const monty = simulation?.kind === "monty-hall" ? simulateMonty(simulation.seed, simulation.trials) : null;
writeFileSync(
  path.join(dir, "manifest.json"),
  JSON.stringify(
    {
      id,
      title: resolved.spec.title,
      template: resolved.spec.template,
      status: resolved.spec.status,
      publicationTarget: resolved.spec.publicationTarget,
      classification: resolved.spec.classification,
      content: { spec: `episodes/${id}.json`, specSha: sha(JSON.stringify(raw)), commit: git("rev-parse --short HEAD"), dirty: Boolean(git("status --porcelain")) },
      renderedAt: new Date().toISOString(),
      files: Object.fromEntries(["reel.mp4", "cover.png", "caption.txt", "transcript.srt"].map((file) => [
        file, createHash("sha256").update(readFileSync(path.join(dir, file))).digest("hex"),
      ])),
      validation: "validation.json",
      video: { ...brand.video, durationInFrames: composition.durationInFrames, seconds: composition.durationInFrames / brand.video.fps, ...settings },
      tools: { remotion: pkg.dependencies.remotion, node: process.version },
      facts: resolved.facts,
      simulation: monty ? {
        ...simulation,
        hostTieBreak: "lowest-numbered losing door other than the contestant's pick",
        exact: { stay: "1/3", switch: "2/3" },
        empirical: { stayWins: monty.stayWins, switchWins: monty.switchWins },
      } : simulation,
      illusion: "illusion" in spec ? { ...spec.illusion, diameter: 2 * spec.illusion.radius } : undefined,
      narration: timings ? {
        ...spec.voice,
        audio: `public/episodes/${id}/${timings.audio}`,
        timings: `public/episodes/${id}/timings.json`,
        script: existsSync(path.join(dir, "script.json")) ? "script.json" : undefined,
        audioSha: sha(readFileSync(path.join(publicDir(id), timings.audio))),
      } : null,
      sources: resolved.spec.sources,
      provenance: [
        { asset: "visuals", origin: "generated in code (src/), no third-party footage" },
        { asset: "public/sfx/*.wav", origin: "procedurally generated by scripts/sfx.ts" },
        { asset: "narration", origin: timings ? `local TTS (${spec.voice?.provider ?? "kokoro"}: Kokoro-82M, Apache-2.0)` : "none" },
        { asset: "font", origin: "Inter (SIL OFL 1.1) via @remotion/google-fonts" },
      ],
    },
    null,
    2,
  ),
);

const problems = validateExport(id);
writeFileSync(path.join(dir, "validation.json"), JSON.stringify({ command: `pnpm validate ${id}`, passed: problems.length === 0, problems }, null, 2) + "\n");
if (problems.length) fail(`export written but failed checks:\n  ${problems.join("\n  ")}`);
console.log(`\u2714 output/${id}/ reel.mp4, cover.png, caption.txt, transcript.srt, manifest.json, validation.json`);
