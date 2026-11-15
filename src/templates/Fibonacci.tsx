import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { inter, tabular } from "../brand/fonts";
import { brand, safeWidth } from "../brand/tokens";
import { Countdown } from "../components/Countdown";
import { enter, ramp } from "../components/motion";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode, useWordCues } from "../episode/context";
import { fibonacci, fibonacciTiles, tilesBox } from "../sims/puzzles";

const { color, safe } = brand;
const palette = [color.primary, color.secondary, color.tertiary];
const ROW_Y = 632;
const TILE = { w: 104, h: 112, pitch: 112 };
const tileX = (k: number) => 540 + (k - 3.5) * TILE.pitch;
const DATE = { y: 830, size: 236, pitch: 150 };
const dateX = (k: number) => 540 + (k - 2) * DATE.pitch;
const AREA = { top: 836, bottom: 1404 };
const text: React.CSSProperties = { position: "absolute", fontFamily: inter, fontWeight: 800, color: color.fg, ...tabular };

const Calendar: React.FC<{ frame: number; out: number }> = ({ frame, out }) => (
  <div style={{
    position: "absolute", left: 540 - 230, top: 640, width: 460, borderRadius: 34, overflow: "hidden",
    background: color.surface, boxShadow: `0 0 0 3px ${color.muted}, 0 26px 50px #05090ea0`,
    opacity: 1 - out, scale: String((1.04 - 0.04 * ramp(frame, 0, 10)) * (1 - 0.25 * out)),
  }}>
    <div style={{ background: color.secondary, color: color.bg, fontFamily: inter, fontWeight: 800, fontSize: 60, letterSpacing: "0.12em", textAlign: "center", padding: "18px 0 14px" }}>
      NOVEMBER
    </div>
    <div style={{ fontFamily: inter, fontWeight: 800, fontSize: 260, lineHeight: 1.12, textAlign: "center", color: color.fg, ...tabular }}>23</div>
  </div>
);

// Squares with Fibonacci sides; `appear[i]` is when square i lands. The camera keeps every landed square in frame.
// The curve is quarter-circle arcs, one per square: an approximation, not an exact golden spiral.
const Squares: React.FC<{
  frame: number; appear: number[]; placeholder: number; draw: number; area: { top: number; bottom: number }; countdown?: React.ReactNode;
}> = ({ frame, appear, placeholder, draw, area, countdown }) => {
  const { tiles } = useMemo(() => fibonacciTiles(8), []);
  // the camera starts widening before a square lands, so a new square never pops in off-frame
  const shown = appear.reduce((s, at) => s + ramp(frame, at - 10, at + 2), 0);
  const k = Math.min(tiles.length, Math.floor(shown));
  const [a, b] = [tilesBox(tiles, Math.max(1, k)), tilesBox(tiles, Math.min(tiles.length, Math.max(1, k + 1)))];
  const t = shown - k;
  const lerp = (p: number, q: number) => p + (q - p) * t;
  const box = { x: lerp(a.x, b.x), y: lerp(a.y, b.y), w: lerp(a.w, b.w), h: lerp(a.h, b.h) };
  const scale = Math.min(190, safeWidth / box.w, (area.bottom - area.top) / box.h);
  const [ox, oy] = [safe.left + safeWidth / 2 - (box.x + box.w / 2) * scale, (area.top + area.bottom) / 2 - (box.y + box.h / 2) * scale];
  const arcs = placeholder >= 0 ? tiles.slice(0, placeholder) : tiles;
  const d = arcs.map(({ s, arc }, i) => `${i ? "" : `M ${arc.from[0]} ${arc.from[1]} `}A ${s} ${s} 0 0 0 ${arc.to[0]} ${arc.to[1]}`).join(" ");
  const ph = tiles[Math.max(0, placeholder)];
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${ox} ${oy}) scale(${scale})`}>
          {tiles.map((tile, i) => {
            const at = appear[i];
            if (frame < at) return null;
            const hole = i === placeholder;
            const p = enter(frame, at, 15, 180);
            const c = palette[i % 3];
            const px = tile.s * scale;
            return (
              <g key={i} opacity={Math.min(1, p * 1.5)} transform={`translate(${tile.x + tile.s / 2} ${tile.y + tile.s / 2}) scale(${0.6 + 0.4 * p})`}>
                <rect x={-tile.s / 2} y={-tile.s / 2} width={tile.s} height={tile.s} rx={Math.min(0.12 * tile.s, 10 / scale)}
                  fill={hole ? "none" : `color-mix(in srgb, ${c} ${22 - 8 * draw}%, ${color.bg})`}
                  stroke={hole ? color.secondary : c} strokeWidth={(hole ? 5 : 3) / scale} strokeDasharray={hole ? `${16 / scale} ${12 / scale}` : undefined} />
                {px > 38 && !(hole && countdown) ? (
                  <text textAnchor="middle" dominantBaseline="central" fill={hole ? color.secondary : c} fontFamily={inter} fontWeight={800}
                    fontSize={Math.min(150, px * 0.42) / scale} opacity={1 - 0.5 * draw}>{hole ? "?" : tile.s}</text>
                ) : null}
              </g>
            );
          })}
          {draw > 0 ? <path d={d} fill="none" stroke={color.fg} strokeWidth={6 / scale} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} /> : null}
        </g>
      </svg>
      {countdown && frame >= appear[placeholder] ? (
        <div style={{ position: "absolute", left: ox + (ph.x + ph.s / 2) * scale - 80, top: oy + (ph.y + ph.s / 2) * scale - 80 }}>{countdown}</div>
      ) : null}
    </>
  );
};

export const Fibonacci: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, bare, timeline } = useEpisode();
  const rule = useBeatStart("rule");
  const think = useBeatStart("think");
  const reveal = useBeatStart("reveal");
  const outro = useBeatStart("outro");
  const spoken = useWordCues("hook", /^(one|two|three)\b/i, [58, 68, 78, 90]);
  if (spec.template !== "fibonacci") return null;

  const f = fibonacci(spec.fibonacci.terms);
  const last = f.length - 1;
  // Cover: squares up to 13, the 21 slot left as "?", arcs through the known squares.
  if (bare) return <Squares frame={0} appear={f.map(() => -100)} placeholder={last} draw={1} area={{ top: 744, bottom: 1384 }} />;

  const steps = [2, 3, 4, 5, 6].map((n, j) => ({ n, at: rule + 4 + j * 16 }));
  const thinkLen = timeline.beats.find((b) => b.id === "think")!.duration;
  const appear = f.map((_, k) => (k < 4 ? spoken[k] + 6 : k < last ? steps[k - 2].at : think));
  const morph = ramp(frame, 10, 22);
  const flip = ramp(frame, reveal, reveal + 10);
  const step = frame >= reveal ? { n: last, at: reveal } : frame >= rule && frame < think ? steps.findLast((s) => frame >= s.at) : undefined;
  const sum = step && { a: f[step.n - 2], b: f[step.n - 1], c: f[step.n], fresh: enter(frame, step.at, 14, 200) };
  const draw = ramp(frame, outro + 4, outro + 40);

  return (
    <>
      {frame < 26 ? <Calendar frame={frame} out={morph} /> : null}

      {/* the date 11/23 splits into the first four numbers of the sequence */}
      {f.map((v, k) => {
        const at = appear[k] - 6;
        // all four date digits lift into the row together on the first "one", so none sits over the squares below
        const move = k < 4 ? ramp(frame, spoken[0] - 6, spoken[0] + 6) : 1;
        const born = k < 4 ? ramp(frame, at, at + 8) : enter(frame, at, 15, 190);
        if (k >= 4 && frame < at) return null;
        const from = dateX(k < 2 ? k : k + 1);
        const x = k < 4 ? from + (tileX(k) - from) * move : tileX(k);
        const y = k < 4 ? DATE.y + (ROW_Y - DATE.y) * move : ROW_Y;
        const size = k < 4 ? DATE.size + (70 - DATE.size) * move : 70;
        const isSource = sum && (k === step!.n - 1 || k === step!.n - 2);
        const isTarget = sum && k === step!.n;
        const unknown = k === last && frame < reveal;
        const edge = isTarget ? color.secondary : isSource ? color.primary : color.muted;
        return (
          <div key={k} style={{
            position: "absolute", left: x - TILE.w / 2, top: y - TILE.h / 2, width: TILE.w, height: TILE.h, display: "grid", placeItems: "center",
            scale: k === last ? `${Math.abs(1 - 2 * flip) || 0.02} 1` : undefined, opacity: k < 4 ? morph : 1,
          }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: 18, opacity: born,
              background: isTarget ? `color-mix(in srgb, ${color.secondary} 26%, ${color.surface})` : color.surface,
              boxShadow: `0 0 0 ${isSource || isTarget ? 5 : 3}px ${edge}`,
              outline: unknown ? `4px dashed ${color.secondary}` : undefined, outlineOffset: -4,
              scale: k >= 4 ? String(0.6 + 0.4 * born) : undefined,
            }} />
            <span style={{
              ...text, position: "relative", fontSize: size, lineHeight: 1, letterSpacing: "-0.04em",
              color: unknown || isTarget ? color.secondary : color.fg, opacity: k >= 4 ? Math.min(1, born * 1.4) : 1,
            }}>{unknown || (k === last && flip < 0.5) ? "?" : v}</span>
          </div>
        );
      })}
      {frame < spoken[0] + 8 ? (
        <>
          <span style={{ ...text, left: dateX(2) - 14, top: DATE.y, translate: "-50% -50%", fontSize: DATE.size, color: color.muted, opacity: morph * (1 - ramp(frame, spoken[0], spoken[0] + 6)) }}>/</span>
          {([["MONTH", dateX(0.5)], ["DAY", dateX(3.5)]] as const).map(([label, x]) => (
            <span key={label} style={{
              ...text, left: x, top: DATE.y + 140, translate: "-50% 0", fontSize: 46, letterSpacing: "0.14em", color: color.fgDim,
              opacity: ramp(frame, 16, 26) * (1 - ramp(frame, spoken[0], spoken[0] + 6)),
            }}>{label}</span>
          ))}
        </>
      ) : null}

      {sum && frame < outro ? (
        <div style={{
          ...text, left: 0, width: 1080, top: 706, textAlign: "center", fontSize: 92, letterSpacing: "-0.04em",
          opacity: Math.min(1, sum.fresh * 1.6) * (1 - ramp(frame, outro - 6, outro)), translate: `0 ${(1 - sum.fresh) * 16}px`,
        }}>
          <span style={{ color: color.primary }}>{sum.a}</span> + <span style={{ color: color.primary }}>{sum.b}</span>
          {" = "}<span style={{ color: color.secondary }}>{sum.c}</span>
        </div>
      ) : null}

      <Squares frame={frame} appear={appear} placeholder={frame < reveal ? last : -1} draw={draw} area={AREA}
        countdown={frame >= think && frame < reveal ? <Countdown from={think} frames={thinkLen} size={160} /> : undefined} />

      <Sfx name="whoosh" at={10} volume={0.12} frames={14} />
      {spoken.map((at, k) => <Sfx key={`d${k}`} name="click" at={at} volume={0.22} frames={6} />)}
      {steps.slice(2).map(({ at }, k) => <Sfx key={`s${k}`} name="click" at={at} volume={0.2} frames={6} />)}
      {Array.from({ length: Math.ceil(thinkLen / 30) }, (_, k) => <Sfx key={`t${k}`} name="tick" at={think + 8 + k * 30} volume={0.2} frames={10} />)}
      <Sfx name="reveal" at={reveal + 4} volume={0.24} frames={32} />
      <Sfx name="whoosh" at={outro + 4} volume={0.1} frames={14} />
      <Sfx name="ding" at={outro + 42} volume={0.14} frames={20} />
    </>
  );
};
