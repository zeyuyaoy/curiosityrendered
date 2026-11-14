import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../episode/timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const enter = (frame: number, at: number, damping = 18, stiffness = 140) =>
  spring({ frame: frame - at, fps: FPS, config: { damping, stiffness, mass: 0.8 } });

export const leave = (frame: number, end: number, len = 8) =>
  interpolate(frame, [end - len, end], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });

export const ramp = (frame: number, from: number, to: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: ease });
