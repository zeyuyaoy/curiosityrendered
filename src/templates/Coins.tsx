import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { inter, tabular } from "../brand/fonts";
import { brand, safeWidth } from "../brand/tokens";
import { enter, ramp } from "../components/motion";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode, useWordCues } from "../episode/context";
import { fewestCoins, greedyCoins } from "../sims/puzzles";

const { color, safe } = brand;
const text: React.CSSProperties = { fontFamily: inter, fontWeight: 800, color: color.fg, ...tabular };
const coinColor = (v: number, all: number[]) => [color.tertiary, color.primary, color.secondary, color.fg][all.indexOf(v)];
const BAR = 150;

const Coin: React.FC<{ v: number; c: string; r: number; x: number; y: number; opacity: number; scale: number }> = ({ v, c, r, x, y, opacity, scale }) => (
  <div style={{
    position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", display: "grid", placeItems: "center",
    background: `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${c} 42%, ${color.surface}), color-mix(in srgb, ${c} 18%, ${color.bg}))`,
    boxShadow: `inset 0 0 0 6px ${c}, inset 0 0 0 14px color-mix(in srgb, ${c} 25%, transparent), 0 12px 24px #05090ea0`,
    opacity, scale: String(scale),
  }}>
    <span style={{ ...text, fontSize: r * 0.95, color: c }}>{v}</span>
  </div>
);

const Row: React.FC<{
  y: number; label: string; target: number; drops: { v: number; at: number }[]; all: number[];
  count: string; countColor: string; countAt: number; opacity: number; glow?: number; empty?: React.ReactNode;
}> = ({ y, label, target, drops, all, count, countColor, countAt, opacity, glow = 0, empty }) => {
  const frame = useCurrentFrame();
  const cell = safeWidth / target;
  let offset = 0;
  return (
    <div style={{ position: "absolute", left: safe.left, top: y, width: safeWidth, opacity }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", height: 76 }}>
        <span style={{ ...text, fontSize: 50, color: color.fgDim, fontWeight: 700 }}>{label}</span>
        <span style={{ ...text, fontSize: 64, color: countColor, opacity: ramp(frame, countAt, countAt + 8), scale: String(1 + 0.2 * (1 - enter(frame, countAt, 12, 220))) }}>{count}</span>
      </div>
      <div style={{ position: "relative", height: BAR, borderRadius: 24, background: color.bg, boxShadow: `0 0 0 ${3 + 3 * glow}px ${glow ? color.primary : color.muted}` }}>
        {Array.from({ length: target - 1 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: cell * (i + 1), top: 22, bottom: 22, borderLeft: `2px dashed ${color.muted}` }} />
        ))}
        {empty}
        {drops.map(({ v, at }, i) => {
          const x = offset * cell;
          offset += v;
          if (frame < at) return null;
          const p = enter(frame, at, 13, 210);
          const c = coinColor(v, all);
          return (
            <div key={i} style={{
              position: "absolute", left: x + 7, top: 7, width: v * cell - 14, height: BAR - 14, borderRadius: 20, display: "grid", placeItems: "center",
              background: `color-mix(in srgb, ${c} 30%, ${color.surface})`, boxShadow: `inset 0 0 0 5px ${c}`,
              opacity: Math.min(1, p * 1.6), translate: `0 ${(1 - p) * -36}px`,
            }}>
              <span style={{ ...text, fontSize: 96, color: c }}>{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Coins: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, bare } = useEpisode();
  const greedy = useBeatStart("greedy");
  const best = useBeatStart("best");
  const { denominations: all, target } = spec.template === "coins" ? spec.coins : { denominations: [1], target: 2 };
  const g = useMemo(() => greedyCoins(all, target)!, [all, target]);
  const b = useMemo(() => fewestCoins(all, target)[target]!, [all, target]);
  const named = useWordCues("hook", /^(one|three|four)\b/i, [10, 22, 34]);
  const gCues = useWordCues("greedy", /^(four|one)\b/i, g.map((_, i) => 18 + i * 14));
  const bCues = useWordCues("best", /^\d/, [...b.map((_, i) => 8 + i * 16), 50]).slice(0, b.length);
  if (spec.template !== "coins") return null;

  const left = (t: number) => target - g.slice(0, gCues.filter((at) => t >= at).length).reduce((s, v) => s + v, 0);
  const shift = bare ? -90 : 0;
  const greedyDone = bare ? -1 : gCues.at(-1)! + 8;
  const bestDone = bCues.at(-1)! + 10;
  const settled = !bare && frame >= bestDone;

  return (
    <>
      {bare ? null : all.map((v, i) => {
        const r = 74 + 8 * v;
        const x = 540 + (i - (all.length - 1) / 2) * 270;
        const lit = ramp(frame, named[i] - 2, named[i] + 6);
        const live = frame >= greedy && frame < best;
        const tooBig = live && v > left(frame);
        const pick = live && left(frame) > 0 && v === Math.max(...all.filter((c) => c <= left(frame)));
        return (
          <Coin key={v} v={v} c={coinColor(v, all)} r={r} x={x} y={704} opacity={(0.4 + 0.6 * lit) * (tooBig ? 0.28 : 1) * (settled ? 0.4 : 1)}
            scale={(0.9 + 0.1 * enter(frame, named[i], 12, 200)) * (pick ? 1.06 + 0.04 * Math.sin(frame / 3) : 1)} />
        );
      })}

      <Row y={846 + shift} label={frame < greedy && !bare ? `Make ${target}` : "Biggest first"} target={target}
        drops={g.map((v, i) => ({ v, at: bare ? -1 : gCues[i] }))} all={all}
        count={`${g.length} coins`} countColor={color.secondary} countAt={greedyDone} opacity={settled ? 0.6 : 1} />
      {bare || frame >= best ? (
        <Row y={1100 + shift} label="Fewest" target={target} drops={bare ? [] : b.map((v, i) => ({ v, at: bCues[i] }))} all={all}
          count={`${b.length} coins`} countColor={color.primary} countAt={bare ? 1e6 : bestDone}
          opacity={bare ? 1 : ramp(frame, best, best + 8)} glow={bare ? 0 : ramp(frame, bestDone, bestDone + 8)}
          empty={bare ? <span style={{ ...text, position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 96, color: color.secondary }}>?</span> : null} />
      ) : null}

      {bare ? null : (
        <>
          {named.map((at, i) => <Sfx key={`n${i}`} name="click" at={at} volume={0.18} frames={6} />)}
          {gCues.map((at, i) => <Sfx key={`g${i}`} name="click" at={at + 2} volume={0.28} frames={6} />)}
          <Sfx name="tick" at={greedyDone} volume={0.2} frames={10} />
          <Sfx name="whoosh" at={best} volume={0.1} frames={14} />
          {bCues.map((at, i) => <Sfx key={`b${i}`} name="click" at={at + 2} volume={0.28} frames={6} />)}
          <Sfx name="reveal" at={bestDone} volume={0.24} frames={32} />
        </>
      )}
    </>
  );
};
