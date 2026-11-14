import { brand } from "../brand/tokens";
import type { Beat } from "./schema";

export const FPS = brand.video.fps;

export type TimedBeat = Beat & { index: number; from: number; duration: number };

export const toTimeline = (beats: Beat[]) => {
  let acc = 0;
  const timed: TimedBeat[] = beats.map((b, index) => {
    const from = Math.round(acc * FPS);
    acc += b.seconds;
    return { ...b, index, from, duration: Math.round(acc * FPS) - from };
  });
  return { beats: timed, durationInFrames: Math.round(acc * FPS) };
};

export const beatAt = (beats: TimedBeat[], frame: number) =>
  beats.find((b) => frame >= b.from && frame < b.from + b.duration) ?? beats[beats.length - 1];
