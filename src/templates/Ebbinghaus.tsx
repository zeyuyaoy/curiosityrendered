import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { inter } from "../brand/fonts";
import { brand } from "../brand/tokens";
import { ramp } from "../components/motion";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode } from "../episode/context";
import { circleGroups, diameter, type Circle } from "./ebbinghausGeometry";

const { color } = brand;

const Disc: React.FC<{ circle: Circle; target?: boolean; outline?: number }> = ({ circle, target, outline = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: circle.x - circle.radius,
      top: circle.y - circle.radius,
      width: circle.radius * 2,
      height: circle.radius * 2,
      borderRadius: "50%",
      backgroundColor: target ? color.secondary : `color-mix(in srgb, ${color.tertiary} 32%, ${color.surface})`,
      boxShadow: target
        ? `inset 0 0 0 5px color-mix(in srgb, ${color.primary} ${outline * 100}%, transparent)`
        : `inset 0 0 0 2px color-mix(in srgb, ${color.tertiary} 62%, ${color.surface})`,
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

  const groups = circleGroups(spec.illusion.radius, bare);
  const [left, right] = groups.map(({ target }) => target);
  const midX = (left.x + right.x) / 2;
  const baseline = (left.y + right.y) / 2 + left.radius;
  const sweepStart = reveal + 0.9 * fps;
  const mergeStart = answer - 0.62 * fps;
  const lock = answer + Math.round(0.4 * fps);
  const restore = ramp(frame, context, context + 0.62 * fps);
  const fade = ramp(frame, reveal, reveal + 0.42 * fps);
  const align = ramp(frame, reveal + 0.3 * fps, sweepStart) * (1 - restore);
  const sweep = ramp(frame, sweepStart, mergeStart);
  const merge = ramp(frame, mergeStart, lock) * (1 - restore);
  const gaugeOpacity = ramp(frame, reveal + 0.62 * fps, sweepStart) * (1 - restore);
  const surroundsOpacity = bare ? 1 : 1 - fade + ramp(frame, context + 0.25 * fps, context + 0.75 * fps);
  const rotation = bare ? 0 : 4 * ramp(frame, 0, reveal) * (1 - restore);
  const [a, b] = bare ? [left, right] : [left, right].map((circle) => ({
    ...circle,
    x: circle.x + (midX - circle.x) * merge,
    y: circle.y + (baseline - circle.radius - circle.y) * align,
  }));
  const measure = diameter(a);
  const gauge = { ...a, x: a.x + (b.x - a.x) * sweep, y: a.y + (b.y - a.y) * sweep };
  const locked = ramp(frame, lock, lock + 0.2 * fps) * (1 - restore);

  return (
    <>
      <div aria-hidden style={{ position: "absolute", inset: 0 }}>
        {groups.map(({ label, target, neighbours }, i) => (
          <div
            key={label}
            style={{
              position: "absolute",
              inset: 0,
              opacity: surroundsOpacity,
              transformOrigin: `${target.x}px ${target.y}px`,
              rotate: `${i === 0 ? rotation : -rotation}deg`,
            }}
          >
            {neighbours.map((circle, j) => <Disc key={j} circle={circle} />)}
          </div>
        ))}
        <Disc circle={a} target />
        <Disc circle={b} target outline={ramp(frame, mergeStart, mergeStart + 0.28 * fps) * (1 - restore)} />
        {bare || frame < reveal ? null : (
          <>
            <div style={{
              position: "absolute",
              left: a.x - a.radius - 38,
              top: baseline - 1,
              width: b.x - a.x + 2 * (a.radius + 38),
              borderTop: `2px dashed ${color.primary}`,
              opacity: 0.48 * gaugeOpacity,
            }} />
            <div style={{
              position: "absolute",
              left: a.x,
              top: measure.top - 1,
              width: gauge.x - a.x,
              borderTop: `2px dashed ${color.primary}`,
              opacity: 0.48 * gaugeOpacity,
            }} />
            <Gauge target={a} opacity={0.55 * sweep * gaugeOpacity * (1 - merge)} />
            <Gauge target={gauge} opacity={gaugeOpacity} />
            <div
              style={{
                position: "absolute",
                top: baseline + 48,
                left: midX,
                translate: `-50% ${(1 - locked) * 12}px`,
                color: color.primary,
                fontFamily: inter,
                fontSize: 52,
                fontWeight: 800,
                whiteSpace: "nowrap",
                letterSpacing: "-0.045em",
                opacity: locked,
              }}
            >
              {measure.length} px
            </div>
          </>
        )}
      </div>
      {bare ? null : (
        <>
          <Sfx name="whoosh" at={Math.round(mergeStart)} volume={0.1} />
          <Sfx name="ding" at={lock} volume={0.14} />
        </>
      )}
    </>
  );
};
