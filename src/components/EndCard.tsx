import React from "react";
import { useCurrentFrame } from "remotion";
import { inter } from "../brand/fonts";
import { Mark } from "../brand/Logo";
import { brand } from "../brand/tokens";
import { enter, ramp } from "./motion";

export const EndCard: React.FC<{ at: number; text?: string }> = ({ at, text = "Follow for the next one." }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = enter(frame, at);
  return (
    <div
      style={{
        position: "absolute",
        left: brand.safe.left,
        top: brand.layout.headlineBottom - 96,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "12px 26px 12px 14px",
        borderRadius: 999,
        background: brand.color.surface,
        boxShadow: `0 0 0 2px ${brand.color.muted}`,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      <Mark size={64} draw={ramp(frame, at, at + 16)} orbit={(1 - ramp(frame, at + 6, at + 30)) * -140} moons={enter(frame, at + 8)} />
      <span style={{ fontFamily: inter, fontWeight: 700, fontSize: brand.size.note + 4, color: brand.color.fg }}>{text}</span>
    </div>
  );
};
