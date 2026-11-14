import { bundle } from "@remotion/bundler";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Timings } from "../src/episode/captions";
import { lintEpisode } from "../src/episode/lint";
import type { EpisodeSpec } from "../src/episode/schema";
import { FPS, toTimeline } from "../src/episode/timeline";
import { episodes } from "../src/episodes";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const outDir = (id: string) => path.join(ROOT, "output", id);
export const publicDir = (id: string) => path.join(ROOT, "public", "episodes", id);
export const ids = () => episodes.map((e) => (e as { id: string }).id);

export const loadSpec = (id: string) => {
  const raw = episodes.find((e) => (e as { id: string }).id === id);
  if (!raw) fail(`unknown episode "${id}". Known: ${ids().join(", ")}`);
  const { errors, warnings, spec } = lintEpisode(raw);
  for (const w of warnings) console.warn(`warn  ${id}: ${w}`);
  if (errors.length || !spec) fail(`${id} has ${errors.length} spec error(s):\n  ${errors.join("\n  ")}`);
  return { raw, spec };
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const narrationScript = (spec: EpisodeSpec, provider?: string) => {
  const voice = { provider: "kokoro", voice: "af_heart", speed: 1, lexicon: {} as Record<string, string>, ...spec.voice };
  if (provider) voice.provider = provider;
  const speak = (s: string) =>
    Object.entries(voice.lexicon).reduce((t, [from, to]) => t.replace(new RegExp(`(?<![\\w*])${esc(from)}(?![\\w*])`, "g"), to), s);
  return {
    id: spec.id,
    voice,
    beats: toTimeline(spec.beats).beats.map((b) => ({ id: b.id, start: b.from / FPS, seconds: b.duration / FPS, narration: speak(b.narration) })),
  };
};

export const synthesisFingerprint = (script: ReturnType<typeof narrationScript>) =>
  createHash("sha256").update(JSON.stringify(script)).digest("hex");

export const missingAssets = (id: string, wantsVoice: boolean, spec?: EpisodeSpec) => {
  const problems: string[] = [];
  for (const s of ["click", "tick", "whoosh", "ding", "reveal", "scan", "bed"])
    if (!existsSync(path.join(ROOT, "public/sfx", `${s}.wav`))) problems.push(`public/sfx/${s}.wav missing (run pnpm sfx)`);
  const timings = path.join(publicDir(id), "timings.json");
  if (wantsVoice && !existsSync(timings)) problems.push(`no narration for ${id} (run pnpm narrate ${id})`);
  if (existsSync(timings)) {
    const t = JSON.parse(readFileSync(timings, "utf8")) as Timings;
    if (!existsSync(path.join(publicDir(id), t.audio))) problems.push(`timings.json points at missing ${t.audio}`);
    if (spec && t.fingerprint !== synthesisFingerprint(narrationScript(spec)))
      problems.push(`narration for ${id} is out of date with the spec (run pnpm narrate ${id})`);
  }
  return problems;
};

export const bundled = () =>
  bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public"), onProgress: () => undefined });

export function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

export const arg = (name: string) => process.argv.includes(`--${name}`);
export const positional = () => process.argv.slice(2).filter((a) => !a.startsWith("--"));
