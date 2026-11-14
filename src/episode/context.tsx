import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import type { Caption } from "@remotion/captions";
import type { Resolved } from "./resolve";
import { beatAt } from "./timeline";

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
