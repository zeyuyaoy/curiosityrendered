import React from "react";
import { useCurrentFrame } from "remotion";
import { brand, safeWidth } from "../brand/tokens";
import type { TimedBeat } from "../episode/timeline";
import { Kinetic } from "./Kinetic";

const { layout, safe, size } = brand;

export const Headline: React.FC<{ hook: string; beats: TimedBeat[] }> = ({ hook, beats }) => {
  const frame = useCurrentFrame();
  const slots = beats
    .map((b, i) => ({ at: b.from, text: i === 0 ? hook : b.text, big: i === 0 }))
    .filter((s) => s.text !== undefined);
  const k = slots.findLastIndex((s) => frame >= s.at);
  if (k < 0) return null;
  const s = slots[k];
  if (!s.text) return null;
  const next = slots[k + 1]?.at;
  return (
    <div
      style={{
        position: "absolute",
        left: safe.left,
        width: safeWidth,
        top: layout.headlineTop,
        height: layout.headlineBottom - layout.headlineTop,
        display: "flex",
        alignItems: "flex-start",
        paddingTop: 8,
      }}
    >
      <Kinetic key={s.at} text={s.text} at={s.at === 0 ? -30 : s.at} until={next} size={s.big ? size.hook : size.headline} />
    </div>
  );
};
