import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { inter, tabular } from "../brand/fonts";
import { brand } from "../brand/tokens";
import { Countdown } from "../components/Countdown";
import { enter, ramp } from "../components/motion";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode, useWordCues } from "../episode/context";
import { handshakes } from "../sims/puzzles";

const { color } = brand;
const C = { x: 540, y: 990 };
const SEAT = 330;
const PLATE = 62;
const HUB = 138;
const ember = `color-mix(in srgb, ${color.secondary} 62%, #C2410C)`;
const text: React.CSSProperties = { fontFamily: inter, fontWeight: 800, color: color.fg, ...tabular };

const seat = (i: number, n: number) => {
  const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
  return { x: C.x + SEAT * Math.cos(a), y: C.y + SEAT * Math.sin(a), a };
};

// A simple autumn leaf: pointed oval, midrib and two veins.
const Leaf: React.FC<{ x: number; y: number; size: number; rot: number; fill: string }> = ({ x, y, size, rot, fill }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, rotate: `${rot}deg` }}>
    <path d="M0 -46 C26 -26 30 14 0 40 C-30 14 -26 -26 0 -46 Z" fill={fill} opacity={0.85} />
    <path d="M0 -40 L0 48 M0 -4 L15 -18 M0 12 L-15 -2" stroke={color.bg} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.55} />
  </svg>
);

const leaves = [
  { x: 126, y: 650, size: 92, rot: -28, fill: color.secondary },
  { x: 962, y: 676, size: 76, rot: 34, fill: ember },
  { x: 104, y: 1316, size: 80, rot: 18, fill: ember },
  { x: 972, y: 1338, size: 96, rot: -42, fill: color.secondary },
];

export const Handshakes: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, bare, timeline } = useEpisode();
  const question = useBeatStart("question");
  const count = useBeatStart("count");
  const reveal = useBeatStart("reveal");
  const shortcut = useBeatStart("shortcut");
  const outro = useBeatStart("outro");
  const groupCues = useWordCues("count", /^(seven|six|five|four|three|two|one)\b/i, [4, 22, 44, 62, 78, 92, 106]);
  const [eight, seven, halved] = useWordCues("shortcut", /^(eight|seven|halved)\b/i, [12, 32, 54]);
  const n = spec.template === "handshakes" ? spec.table.guests : 8;
  const { groups, running } = useMemo(() => handshakes(n), [n]);
  if (spec.template !== "handshakes") return null;

  const qLen = timeline.beats.find((b) => b.id === "question")!.duration;
  const g = groupCues.findLastIndex((at) => frame >= at);
  const counting = frame >= count && frame < reveal;
  const tally = frame >= reveal ? running.at(-1)! : g >= 0 && frame >= count ? running[g] : null;
  const glow = ramp(frame, reveal, reveal + 12);
  const dim = ramp(frame, shortcut, shortcut + 12) * (1 - ramp(frame, outro, outro + 12));
  const examples = [[0, 3], [1, 6]].map(([a, b], k) => ({ a, b, p: ramp(frame, question + 8 + 16 * k, question + 20 + 16 * k) * (1 - ramp(frame, question + 52, question + 62)) }));

  const edges = groups.flatMap((grp, gi) => grp.map(([a, b], k) => {
    if (bare) return { a, b, draw: 1, stroke: ember, width: 4, opacity: 0.8 };
    const start = groupCues[gi] + k * 1.5;
    const draw = frame < count ? 0 : ramp(frame, start, start + 9);
    const active = counting && gi === g;
    return {
      a, b, draw,
      stroke: glow > 0 ? ember : active ? color.primary : color.fg,
      width: active ? 6 : 3 + 2 * glow,
      opacity: (active ? 1 : glow > 0 ? 0.55 + 0.4 * glow : 0.32) * (1 - 0.7 * dim),
    };
  }));

  return (
    <div style={{ position: "absolute", inset: 0, transform: bare ? "translateY(52px) scale(0.9)" : undefined, transformOrigin: `${C.x}px ${C.y}px` }}>
      {leaves.map((l, i) => (
        <Leaf key={i} {...l} y={l.y + 6 * Math.sin(frame / 22 + i * 1.7)} rot={l.rot + 7 * Math.sin(frame / 30 + i)} />
      ))}
      <div style={{
        position: "absolute", left: C.x - SEAT + 40, top: C.y - SEAT + 40, width: 2 * (SEAT - 40), height: 2 * (SEAT - 40), borderRadius: "50%",
        background: `radial-gradient(color-mix(in srgb, ${color.secondary} 16%, ${color.surface}), ${color.surface} 70%)`,
        boxShadow: `0 0 0 4px color-mix(in srgb, ${color.secondary} 34%, transparent), 0 30px 60px #05090e90`,
      }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {edges.map(({ a, b, draw, stroke, width, opacity }, i) => {
          if (draw <= 0) return null;
          const [p, q] = [seat(a, n), seat(b, n)];
          return <line key={i} x1={p.x} y1={p.y} x2={p.x + (q.x - p.x) * draw} y2={p.y + (q.y - p.y) * draw}
            stroke={stroke} strokeWidth={width} strokeLinecap="round" opacity={opacity} />;
        })}
        {examples.map(({ a, b, p }, k) => {
          if (p <= 0 || bare) return null;
          const [s, t] = [seat(a, n), seat(b, n)];
          return <line key={`e${k}`} x1={s.x} y1={s.y} x2={s.x + (t.x - s.x) * Math.min(1, p * 1.4)} y2={s.y + (t.y - s.y) * Math.min(1, p * 1.4)}
            stroke={color.primary} strokeWidth={6} strokeLinecap="round" opacity={Math.min(1, p * 2)} />;
        })}
      </svg>

      {Array.from({ length: n }, (_, i) => {
        const s = seat(i, n);
        const pop = bare ? 1 : enter(frame, -6 + i * 3, 14, 190);
        const active = (counting && i === g) || examples.some((e) => e.p > 0.2 && (e.a === i || e.b === i));
        const badge = bare ? 0 : enter(frame, seven + i, 14, 220) * (frame >= seven ? 1 : 0) * (1 - ramp(frame, outro, outro + 8));
        return (
          <React.Fragment key={i}>
            <div style={{
              position: "absolute", left: s.x - PLATE, top: s.y - PLATE, width: 2 * PLATE, height: 2 * PLATE, borderRadius: "50%",
              display: "grid", placeItems: "center", background: `radial-gradient(${color.surface} 52%, #F7F8FA1C 54%, ${color.surface} 70%)`,
              boxShadow: `0 0 0 ${active ? 6 : 4}px ${active ? color.primary : color.secondary}, 0 12px 24px #05090eb0`,
              opacity: Math.min(1, pop * 1.5), scale: String((0.5 + 0.5 * pop) * (active ? 1.08 : 1)),
            }}>
              <span style={{ ...text, fontSize: 52 }}>{i + 1}</span>
            </div>
            {badge > 0 ? (
              <div style={{
                position: "absolute", left: s.x + Math.cos(s.a) * 88 - 30, top: s.y + Math.sin(s.a) * 88 - 30, width: 60, height: 60, borderRadius: "50%",
                display: "grid", placeItems: "center", background: color.primary, scale: String(badge),
              }}>
                <span style={{ ...text, fontSize: 36, color: color.bg }}>{n - 1}</span>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      <div style={{
        position: "absolute", left: C.x - HUB, top: C.y - HUB, width: 2 * HUB, height: 2 * HUB, borderRadius: "50%",
        background: color.bg, boxShadow: `0 0 0 4px ${glow > 0 ? color.secondary : color.muted}`, display: "grid", placeItems: "center",
      }}>
        {bare ? <span style={{ ...text, fontSize: 170, color: color.secondary }}>?</span>
          : frame < question ? <Leaf x={HUB} y={HUB} size={150 * enter(frame, 4, 14, 160)} rot={-18 + 6 * Math.sin(frame / 20)} fill={color.secondary} />
          : frame < count ? (
            frame >= question + 30 ? <Countdown from={question + 30} frames={qLen - 30} size={236} /> : <span style={{ ...text, fontSize: 170, color: color.secondary }}>?</span>
          ) : (
            tally === null ? <span style={{ ...text, fontSize: 150, color: color.muted }}>0</span> : (
              <span style={{
                ...text, fontSize: 150, letterSpacing: "-0.05em",
                color: frame >= shortcut && frame >= seven && frame < halved ? color.fg : frame >= reveal ? color.secondary : color.primary,
                scale: String(1 + 0.18 * (1 - enter(frame, frame >= halved ? halved : frame >= seven && frame >= shortcut ? seven : frame >= reveal ? reveal : groupCues[g], 12, 220))),
              }}>{frame >= shortcut && frame >= seven && frame < halved ? n * (n - 1) : tally}</span>
            )
          )}
      </div>

      {!bare && frame >= count && frame < shortcut ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 290, textAlign: "center" }}>
          <div style={{ ...text, fontSize: 72, letterSpacing: "-0.03em" }}>
            {groups.map((grp, gi) => (
              <span key={gi} style={{ opacity: frame >= groupCues[gi] ? 1 : 0.16, color: counting && gi === g ? color.primary : color.fg }}>
                {gi ? " + " : ""}{grp.length}
              </span>
            ))}
          </div>
          <div style={{ ...text, fontSize: 104, color: color.secondary, opacity: ramp(frame, reveal, reveal + 8), translate: `0 ${(1 - enter(frame, reveal)) * 20}px` }}>
            = {running.at(-1)}
          </div>
        </div>
      ) : null}

      {!bare && frame >= shortcut && frame < outro ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 282, textAlign: "center", opacity: 1 - ramp(frame, outro - 6, outro) }}>
          <div style={{ ...text, fontSize: 100, letterSpacing: "-0.03em", opacity: ramp(frame, eight, eight + 8) }}>
            {n} × <span style={{ color: color.primary, opacity: ramp(frame, seven, seven + 8) }}>{n - 1}</span>
            <span style={{ opacity: ramp(frame, seven + 6, seven + 14) }}> = {n * (n - 1)}</span>
          </div>
          <div style={{ ...text, fontSize: 100, letterSpacing: "-0.03em", color: color.secondary, opacity: ramp(frame, halved, halved + 8), translate: `0 ${(1 - enter(frame, halved)) * 20}px` }}>
            ÷ 2 = {running.at(-1)}
          </div>
        </div>
      ) : null}

      {bare ? null : (
        <>
          {Array.from({ length: n }, (_, i) => <Sfx key={`p${i}`} name="click" at={Math.max(0, i * 3 - 4)} volume={0.12} frames={5} />)}
          <Sfx name="whoosh" at={question + 8} volume={0.1} frames={14} />
          {[question + 30, question + 60].map((at) => <Sfx key={at} name="tick" at={at} volume={0.2} frames={10} />)}
          {groupCues.map((at, i) => <Sfx key={`g${i}`} name="scan" at={at} volume={0.12} frames={Math.min(10, groups[i].length * 2)} />)}
          <Sfx name="reveal" at={reveal + 2} volume={0.24} frames={32} />
          <Sfx name="click" at={seven} volume={0.2} frames={6} />
          <Sfx name="ding" at={halved + 4} volume={0.16} frames={22} />
        </>
      )}
    </div>
  );
};
