import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import type { Caption } from "@remotion/captions";
import type { Resolved } from "./resolve";
import { beatAt, FPS } from "./timeline";

export const EpisodeContext = createContext<(Resolved & { captions: Caption[]; bare: boolean }) | null>(null);

export const useEpisode = () => {
  const ctx = useContext(EpisodeContext);
  if (!ctx) throw new Error("useEpisode outside <Episode>");
  return ctx;
};

export const useBeat = () => {
  const frame = useCurrentFrame();
  const { timeline } = useEpisode();
  const beat = beatAt(timeline.beats, frame);
  const local = frame - beat.from;
  return { frame, beat, local, progress: Math.min(1, local / beat.duration) };
};

export const useBeatStart = (id: string) => {
  const b = useEpisode().timeline.beats.find((x) => x.id === id);
  if (!b) throw new Error(`no beat "${id}"`);
  return b.from;
};

// Frames at which the beat's spoken words matching `re` start (from TTS word timings, or estimated captions),
// so a visual can land on the word. Falls back to beat-relative `fallback` frames if the match count differs.
export const useWordCues = (id: string, re: RegExp, fallback: number[]) => {
  const { timeline, captions } = useEpisode();
  const b = timeline.beats.find((x) => x.id === id)!;
  const [lo, hi] = [b.from, b.from + b.duration].map((f) => (f / FPS) * 1000);
  const hits = captions.filter((c) => c.startMs >= lo && c.startMs < hi && re.test(c.text));
  return hits.length === fallback.length ? hits.map((c) => Math.round((c.startMs / 1000) * FPS)) : fallback.map((f) => b.from + f);
};
