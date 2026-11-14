import { computeMaze, type Facts } from "../sims/compute";
import type { EpisodeSpec } from "./schema";
import { toTimeline } from "./timeline";

export const PLACEHOLDER = /\{([\w.]+)\}/g;
export const fill = (s: string, facts: Facts) =>
  s.replace(PLACEHOLDER, (m, k: string) => (k in facts ? String(facts[k]) : m));

export const resolveEpisode = (spec: EpisodeSpec) => {
  const maze = spec.template === "simulation" && spec.sim.kind === "maze" ? computeMaze(spec.sim) : null;
  const facts: Facts = maze?.facts ?? {};
  const beats = spec.beats.map((b) => ({
    ...b,
    narration: fill(b.narration, facts),
    text: b.text === undefined ? undefined : fill(b.text, facts),
  }));
  return {
    spec: {
      ...spec,
      hook: fill(spec.hook, facts),
      cover: { ...spec.cover, headline: fill(spec.cover.headline, facts), sub: spec.cover.sub && fill(spec.cover.sub, facts) },
      beats,
      post: { ...spec.post, caption: fill(spec.post.caption, facts) },
    } as EpisodeSpec,
    facts,
    maze,
    timeline: toTimeline(beats),
  };
};

export type Resolved = ReturnType<typeof resolveEpisode>;
