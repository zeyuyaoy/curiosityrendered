import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase-kebab-case");

export const Beat = z.object({
  id: slug,
  seconds: z.number().min(0.5).max(20),
  narration: z.string().default(""),
  text: z.string().optional(),
});

const Base = z.object({
  id: slug,
  title: z.string().min(3),
  classification: z.enum(["real", "simulated", "hypothetical"]),
  status: z.enum(["draft", "review", "approved"]).default("draft"),
  hook: z.string().min(3),
  beats: z.array(Beat).min(3),
  voice: z
    .object({
      provider: z.string().default("kokoro"),
      voice: z.string().default("af_heart"),
      speed: z.number().min(0.5).max(2).default(1),
      lexicon: z.record(z.string(), z.string()).default({}),
    })
    .optional(),
  cover: z.object({ headline: z.string().max(24), sub: z.string().max(60).optional(), beat: z.string().optional() }),
  cta: z.string().max(40).optional(),
  sources: z.array(z.object({ claim: z.string(), ref: z.string() })).default([]),
  post: z.object({
    caption: z.string().min(1).max(2200),
    hashtags: z.array(z.string().regex(/^#[A-Za-z0-9_]+$/)).max(5),
  }),
});

export const MazeSim = z.object({
  kind: z.literal("maze"),
  cellsX: z.number().int().min(3).max(40),
  cellsY: z.number().int().min(2).max(20),
  seed: z.number().int(),
  loops: z.number().min(0).max(1),
});

export const EpisodeSpec = z.discriminatedUnion("template", [
  Base.extend({ template: z.literal("simulation"), sim: z.discriminatedUnion("kind", [MazeSim]) }),
  Base.extend({
    template: z.literal("challenge"),
    challenge: z.object({
      options: z.array(z.string().max(24)).min(2).max(4),
      answer: z.number().int().min(0),
      explanation: z.string().max(90),
    }),
  }),
  Base.extend({
    template: z.literal("explainer"),
    points: z.array(z.object({ heading: z.string().max(28), body: z.string().max(90) })).min(1).max(4),
  }),
]);

export type EpisodeSpec = z.output<typeof EpisodeSpec>;
export type EpisodeInput = z.input<typeof EpisodeSpec>;
export type Beat = z.output<typeof Beat>;
