import { simBeats } from "../sims/compute";
import { PLACEHOLDER, resolveEpisode } from "./resolve";
import { EpisodeSpec } from "./schema";

export const LIMITS = { wordsPerSecond: 3.0, hookWords: 9, hookChars: 56, textChars: 60, minSeconds: 7, maxSeconds: 90 };

const words = (s: string) => s.replace(/[*~]/g, "").split(/\s+/).filter(Boolean).length;
const longestLine = (s: string) => Math.max(...s.split("\n").map((l) => l.replace(/[*~]/g, "").length));

export const lintEpisode = (raw: unknown) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = EpisodeSpec.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`), warnings, spec: null };
  }
  const { spec } = resolveEpisode(parsed.data);
  const ids = spec.beats.map((b) => b.id);

  if (new Set(ids).size !== ids.length) errors.push(`beats: duplicate ids in [${ids.join(", ")}]`);
  if (ids[0] !== "hook") errors.push(`beats: first beat must be "hook" (got "${ids[0]}")`);
  if (ids.at(-1) !== "outro") errors.push(`beats: last beat must be "outro" (got "${ids.at(-1)}")`);
  const required = {
    simulation: spec.template === "simulation" ? simBeats[spec.sim.kind] : [],
    challenge: ["question", "think", "reveal"],
    explainer: spec.template === "explainer" ? [...spec.points.map((_, i) => `point-${i + 1}`), "takeaway"] : [],
    "monty-hall": ["question", "think", "reveal", "simulation"],
    ebbinghaus: ["reveal", "answer", "context"],
    fibonacci: ["rule", "think", "reveal"],
    handshakes: ["question", "count", "reveal", "shortcut"],
    coins: ["greedy", "best"],
    "digit-sum": ["sum", "again"],
  }[spec.template];
  for (const r of required) if (!ids.includes(r)) errors.push(`beats: ${spec.template} template needs a "${r}" beat`);
  if (!["simulation", "challenge", "explainer"].includes(spec.template) &&
      ids.join(",") !== ["hook", ...required, "outro"].join(","))
    errors.push(`beats: ${spec.template} expects hook, ${required.join(", ")}, outro in order`);
  if (spec.template === "challenge" && spec.challenge.answer >= spec.challenge.options.length)
    errors.push(`challenge.answer: index ${spec.challenge.answer} but only ${spec.challenge.options.length} options`);
  if (spec.classification === "real" && spec.sources.length === 0)
    errors.push("sources: a \"real\" episode needs at least one source for its claims");
  if (spec.cover.beat && !ids.includes(spec.cover.beat)) errors.push(`cover.beat: no beat "${spec.cover.beat}"`);

  const texts: [string, string][] = [
    ["hook", spec.hook],
    ["cover.headline", spec.cover.headline],
    ["post.caption", spec.post.caption],
    ...spec.beats.flatMap((b): [string, string][] => [
      [`beats.${b.id}.narration`, b.narration],
      [`beats.${b.id}.text`, b.text ?? ""],
    ]),
  ];
  for (const [where, s] of texts) {
    const left = s.match(PLACEHOLDER);
    if (left) errors.push(`${where}: unknown placeholder ${left.join(", ")}`);
  }

  if (words(spec.hook) > LIMITS.hookWords) errors.push(`hook: ${words(spec.hook)} words (max ${LIMITS.hookWords})`);
  if (spec.hook.length > LIMITS.hookChars) errors.push(`hook: ${spec.hook.length} chars (max ${LIMITS.hookChars})`);
  if (spec.hook.split("\n").length > 3 || longestLine(spec.hook) > 22)
    errors.push("hook: keep to 3 lines of at most 22 characters (use \\n to break lines)");
  for (const b of spec.beats) {
    if (b.text && b.text.length > LIMITS.textChars)
      errors.push(`beats.${b.id}.text: ${b.text.length} chars (max ${LIMITS.textChars})`);
    const rate = words(b.narration) / Math.max(0.1, b.seconds - 0.3);
    if (rate > LIMITS.wordsPerSecond)
      errors.push(`beats.${b.id}.narration: ~${rate.toFixed(1)} words/s (max ${LIMITS.wordsPerSecond}); cut words or add time`);
    const sentences = b.narration.split(/[.?!]\s+/).filter(Boolean).length;
    const est = (words(b.narration) / 2.8 + 0.4 * Math.max(0, sentences - 1)) / (spec.voice?.speed ?? 1) + 0.25;
    if (b.narration && est > b.seconds)
      warnings.push(`beats.${b.id}: narration likely needs ~${est.toFixed(1)}s but the beat is ${b.seconds}s`);
  }
  const total = spec.beats.reduce((s, b) => s + b.seconds, 0);
  if (total < LIMITS.minSeconds || total > LIMITS.maxSeconds)
    errors.push(`duration: ${total.toFixed(1)}s outside ${LIMITS.minSeconds}-${LIMITS.maxSeconds}s`);
  if (!spec.beats.some((b) => b.narration)) warnings.push("no narration: video will be silent");

  return { errors, warnings, spec };
};
