import React from "react";
import { useCurrentFrame } from "remotion";
import { inter, tabular } from "../brand/fonts";
import { brand } from "../brand/tokens";
import { ramp } from "./motion";
import { FPS } from "../episode/timeline";

const { color } = brand;

export const Countdown: React.FC<{ from: number; frames: number; size?: number; label?: React.ReactNode }> = ({ from, frames, size = 220, label }) => {
  const frame = useCurrentFrame();
  const r = size / 2 - 14;
  const len = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color.muted} strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color.secondary} strokeWidth={10} strokeDasharray={len}
          strokeDashoffset={len * ramp(frame, from, from + frames, (t) => t)} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: inter, fontWeight: 800, fontSize: size * 0.36, color: color.fg, ...tabular }}>
        {label ?? Math.max(1, Math.ceil((from + frames - frame) / FPS))}
      </div>
    </div>
  );
};
