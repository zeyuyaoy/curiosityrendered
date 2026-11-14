import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Timings } from "../src/episode/captions";
import { toTimeline } from "../src/episode/timeline";
import { arg, fail, loadSpec, narrationScript, outDir, positional, publicDir, ROOT, synthesisFingerprint } from "./lib";

const [id] = positional();
if (!id) fail("usage: pnpm narrate <episode-id> [--provider say]");
const { spec } = loadSpec(id);

const provider = process.argv.includes("--provider") ? process.argv[process.argv.indexOf("--provider") + 1] : undefined;
const script = narrationScript(spec, provider);
mkdirSync(outDir(id), { recursive: true });
const scriptPath = path.join(outDir(id), "script.json");
writeFileSync(scriptPath, JSON.stringify(script, null, 2));

const py = spawnSync("uv", ["run", "--project", "tts", "python", "tts/narrate.py", scriptPath], { cwd: ROOT, stdio: "inherit" });
if (py.status !== 0) fail("narration failed (see above)");

const timingsPath = path.join(publicDir(id), "timings.json");
const t = JSON.parse(readFileSync(timingsPath, "utf8")) as Timings;
writeFileSync(timingsPath, JSON.stringify({ ...t, fingerprint: synthesisFingerprint(script) }, null, 2) + "\n");
const { beats } = toTimeline(spec.beats);
for (const b of t.beats) {
  const shown = beats.find((x) => x.id === b.id)!.narration.split(/\s+/).filter(Boolean).length;
  if (b.words && b.words.length !== shown)
    console.warn(`warn  ${b.id}: ${b.words.length} spoken tokens vs ${shown} caption words; captions will show spoken text`);
}
if (!arg("quiet")) console.log(`✔ narration ready in public/episodes/${id}/`);
