import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { inter } from "../brand/fonts";
import { brand, safeWidth } from "../brand/tokens";
import { Countdown } from "../components/Countdown";
import { enter } from "../components/motion";
import { Reveal } from "../components/Reveal";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode } from "../episode/context";
import { FPS } from "../episode/timeline";

const { color, size, layout, radius, safe } = brand;

export const Challenge: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, timeline } = useEpisode();
  const q = useBeatStart("question");
  const think = useBeatStart("think");
  const reveal = useBeatStart("reveal");
  if (spec.template !== "challenge") return null;
  const { options, answer, explanation } = spec.challenge;
  const thinkLen = timeline.beats.find((b) => b.id === "think")!.duration;
  const thinking = frame >= think && frame < reveal;

  return (
    <AbsoluteFill style={{ top: layout.bodyTop, height: layout.bodyBottom - layout.bodyTop, left: safe.left, width: safeWidth, gap: 26 }}>
      {options.map((o, i) => {
        const right = i === answer;
        const r = frame >= reveal ? enter(frame, reveal) : 0;
        return (
          <Reveal key={o} at={q + i * 5} from="up">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "26px 32px",
                borderRadius: radius.md,
                background: color.surface,
                boxShadow: `0 0 0 ${3 + 3 * r * (right ? 1 : 0)}px ${right && r ? color.primary : color.muted}`,
                opacity: 1 - (right ? 0 : 0.55 * r),
              }}
            >
              <span style={{ fontFamily: inter, fontWeight: 800, fontSize: size.label, color: right && r ? color.primary : color.fgDim }}>
                {"ABCD"[i]}
              </span>
              <span style={{ fontFamily: inter, fontWeight: 700, fontSize: size.body, color: color.fg }}>{o}</span>
            </div>
          </Reveal>
        );
      })}
      {thinking ? (
        <div style={{ alignSelf: "center", marginTop: 20 }}>
          <Countdown from={think} frames={thinkLen} />
        </div>
      ) : null}
      {Array.from({ length: Math.ceil(thinkLen / FPS) }, (_, k) => (
        <Sfx key={k} name="tick" at={think + k * FPS} volume={0.3} />
      ))}
      <Sfx name="reveal" at={reveal} />
      <Reveal at={reveal + 12} from="up">
        <div style={{ fontFamily: inter, fontWeight: 500, fontSize: size.body, color: color.fg, lineHeight: 1.22, marginTop: 12 }}>{explanation}</div>
      </Reveal>
    </AbsoluteFill>
  );
};
