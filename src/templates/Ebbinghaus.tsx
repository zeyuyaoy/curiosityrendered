import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { inter } from "../brand/fonts";
import { brand } from "../brand/tokens";
import { ramp } from "../components/motion";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode } from "../episode/context";
import { circleGroups, coverDrop, diameter, type Circle } from "./ebbinghausGeometry";

const { color } = brand;

const Disc: React.FC<{ circle: Circle; target?: boolean }> = ({ circle, target }) => (
  <div
    style={{
      position: "absolute",
      left: circle.x - circle.radius,
      top: circle.y - circle.radius,
      width: circle.radius * 2,
      height: circle.radius * 2,
      borderRadius: "50%",
      backgroundColor: target ? color.secondary : `color-mix(in srgb, ${color.tertiary} 32%, ${color.surface})`,
      boxShadow: target ? undefined : `inset 0 0 0 2px color-mix(in srgb, ${color.tertiary} 62%, ${color.surface})`,
    }}
  />
);

const Gauge: React.FC<{ target: Circle; opacity: number }> = ({ target, opacity }) => {
  const { top, length } = diameter(target);
  return (
    <div
      style={{
        position: "absolute",
        left: target.x - target.radius - 22,
        top,
        width: length + 44,
        height: length,
        opacity,
      }}
    >
      <div style={{ position: "absolute", right: 14, top: 0, width: 4, height: "100%", backgroundColor: color.primary }} />
      {[0, length].map((y) => (
        <div key={y} style={{ position: "absolute", top: y - 2, width: "100%", height: 4, backgroundColor: color.primary }} />
      ))}
    </div>
  );
};

export const Ebbinghaus: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { spec, bare } = useEpisode();
  const reveal = useBeatStart("reveal");
  const answer = useBeatStart("answer");
  const context = useBeatStart("context");
  if (spec.template !== "ebbinghaus") return null;

  const groups = circleGroups(spec.illusion.radius);
  const [left, right] = groups.map(({ target }) => target);
  const slideStart = reveal + Math.min(0.85 * fps, (answer - reveal) / 2);
  const slide = ramp(frame, slideStart, answer);
  const fade = ramp(frame, reveal, reveal + 0.45 * fps);
  const restore = ramp(frame, context, context + 0.55 * fps);
  const gaugeOpacity = ramp(frame, reveal + 0.25 * fps, reveal + 0.55 * fps) * (1 - restore);
  const compared = ramp(frame, answer, answer + 0.25 * fps);
  const labelOpacity = ramp(frame, 0, 0.35 * fps) * (1 - fade + fade * restore);
  const surroundsOpacity = bare ? 1 : 1 - fade + restore;
  const measure = diameter(left);

  return (
    <>
      <div aria-hidden style={{ position: "absolute", inset: 0, translate: bare ? `0 ${coverDrop}px` : undefined }}>
        {groups.map(({ label, target, neighbours }) => (
          <React.Fragment key={label}>
            <div style={{ opacity: surroundsOpacity }}>
              {neighbours.map((circle, i) => <Disc key={i} circle={circle} />)}
            </div>
            <Disc circle={target} target />
            {bare ? null : (
              <div
                style={{
                  position: "absolute",
                  left: target.x,
                  top: 1220,
                  translate: "-50% 0",
                  color: color.fgDim,
                  fontFamily: inter,
                  fontSize: 42,
                  fontWeight: 700,
                  opacity: labelOpacity,
                }}
              >
                {label}
              </div>
            )}
          </React.Fragment>
        ))}
        {bare || frame < reveal ? null : (
          <>
            {[measure.top, measure.bottom].map((y) => (
              <div
                key={y}
                style={{
                  position: "absolute",
                  left: left.x,
                  top: y - 1,
                  width: (right.x - left.x) * slide,
                  borderTop: `2px dashed ${color.primary}`,
                  opacity: 0.4 * gaugeOpacity,
                }}
              />
            ))}
            <Gauge target={left} opacity={0.65 * slide * gaugeOpacity} />
            <Gauge target={{ ...left, x: left.x + (right.x - left.x) * slide }} opacity={gaugeOpacity} />
            <div
              style={{
                position: "absolute",
                top: 1170,
                left: (left.x + right.x) / 2,
                translate: `-50% ${(1 - compared) * 14}px`,
                color: color.primary,
                fontFamily: inter,
                fontSize: 64,
                fontWeight: 800,
                whiteSpace: "nowrap",
                letterSpacing: "-0.045em",
                opacity: compared * (1 - restore),
              }}
            >
              Same diameter
            </div>
          </>
        )}
      </div>
      {bare ? null : (
        <>
          <Sfx name="whoosh" at={Math.round(slideStart)} volume={0.1} />
          <Sfx name="ding" at={answer} volume={0.18} />
        </>
      )}
    </>
  );
};
