import { lintEpisode } from "../src/episode/lint";
import { episodes } from "../src/episodes";
import { missingAssets } from "./lib";

let errors = 0;
for (const raw of episodes) {
  const id = (raw as { id: string }).id;
  const r = lintEpisode(raw);
  const narrated = r.spec?.beats.some((b) => b.narration) ?? false;
  const assets = r.spec ? missingAssets(id, narrated && r.spec.status !== "draft", r.spec) : [];
  const problems = [...r.errors, ...assets];
  errors += problems.length;
  console.log(`${problems.length ? "\u2716" : "\u2714"} ${id} [${r.spec?.status ?? "invalid"}]`);
  for (const p of problems) console.log(`    error  ${p}`);
  for (const w of r.warnings) console.log(`    warn   ${w}`);
}
if (errors) process.exit(1);
