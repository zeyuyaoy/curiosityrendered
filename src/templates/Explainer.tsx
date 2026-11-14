import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { inter } from "../brand/fonts";
import { brand, safeWidth } from "../brand/tokens";
import { Reveal } from "../components/Reveal";
import { Sfx } from "../components/Sfx";
import { useEpisode } from "../episode/context";

const { color, size, layout, radius, safe } = brand;
const series = [color.primary, color.secondary, color.tertiary];

export const Explainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, timeline } = useEpisode();
  if (spec.template !== "explainer") return null;
  const start = (id: string) => timeline.beats.find((b) => b.id === id)!.from;
  const takeaway = start("takeaway");

  return (
    <AbsoluteFill style={{ top: layout.bodyTop, height: layout.bodyBottom - layout.bodyTop, left: safe.left, width: safeWidth, gap: 24 }}>
      {spec.points.map((p, i) => {
        const at = start(`point-${i + 1}`);
        const end = i + 1 < spec.points.length ? start(`point-${i + 2}`) : takeaway;
        return (
          <React.Fragment key={p.heading}>
          <Sfx name="click" at={at} volume={0.25} />
          <Reveal at={at} from="up">
            <div
              style={{
                display: "flex",
                gap: 26,
                padding: 30,
                borderRadius: radius.md,
                background: color.surface,
                opacity: frame < end ? 1 : 0.5,
              }}
            >
              <span style={{ fontFamily: inter, fontWeight: 800, fontSize: size.headline, lineHeight: 1, color: series[i % 3] }}>{i + 1}</span>
              <div>
                <div style={{ fontFamily: inter, fontWeight: 700, fontSize: size.body, color: color.fg }}>{p.heading}</div>
                <div style={{ fontFamily: inter, fontWeight: 500, fontSize: size.note + 6, color: color.fgDim, lineHeight: 1.3, marginTop: 8 }}>
                  {p.body}
                </div>
              </div>
            </div>
          </Reveal>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
