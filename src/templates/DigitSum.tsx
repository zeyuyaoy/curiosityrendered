import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { inter, tabular } from "../brand/fonts";
import { brand } from "../brand/tokens";
import { ramp } from "../components/motion";
import { Reveal } from "../components/Reveal";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode, useWordCues } from "../episode/context";
import { digitChain, divisibleNumber, groupThousands } from "../sims/puzzles";

const { color } = brand;
const text: React.CSSProperties = { fontFamily: inter, fontWeight: 800, color: color.fg, ...tabular };
const center: React.CSSProperties = { position: "absolute", left: 0, width: 1080, textAlign: "center" };

const Arrow: React.FC<{ y: number; p: number }> = ({ y, p }) => (
  <svg width={60} height={52} viewBox="0 0 60 52" style={{ position: "absolute", left: 510, top: y, opacity: p, translate: `0 ${(1 - p) * -10}px` }}>
    <path d="M30 4 V40 M14 28 L30 44 L46 28" stroke={color.fgDim} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// One vertical chain: the 36-digit number, its digit sum, and that sum's digit sum.
// Why it works (each power of ten is a multiple of 9 plus 1) lives in the post caption, not on screen.
export const DigitSum: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, bare } = useEpisode();
  const sum = useBeatStart("sum");
  const again = useBeatStart("again");
  const cfg = spec.template === "digit-sum" ? spec.number : { seed: 1, digits: 12 };
  const chain = useMemo(() => digitChain(divisibleNumber(cfg.seed, cfg.digits)), [cfg.seed, cfg.digits]);
  const [total] = useWordCues("sum", new RegExp(`^${chain[1]}\\b`), [60]);
  const parts = useWordCues("again", /^\d/, [4, 18, 32, 48]);
  const yes = useWordCues("again", /^yes/i, [74])[0];
  if (spec.template !== "digit-sum") return null;

  const [n, s, s2] = chain;
  const rows = groupThousands(n).match(/(\d{1,3},?){1,3}/g)!;
  const scanStart = sum + 4;
  const scanEnd = total - 2;
  const lit = bare ? 0 : Math.floor(interpolate(frame, [scanStart, scanEnd], [0, n.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const running = [...n].slice(0, lit).reduce((a, d) => a + Number(d), 0);
  const done = !bare && frame >= yes;
  const glint = bare ? -99 : interpolate(frame, [24, 70], [-4, n.length + 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let k = 0;

  return (
    <>
      <div style={{ ...center, top: bare ? 770 : 584 }}>
        {rows.map((row, r) => (
          <div key={r} style={{ ...text, fontSize: 100, lineHeight: 1.12, letterSpacing: "-0.02em" }}>
            {[...row].map((ch, j) => {
              if (ch === ",") return <span key={j} style={{ color: color.muted }}>,</span>;
              const i = k++;
              const p = bare ? 1 : ramp(frame, i * 0.2 - 4, i * 0.2 + 3);
              const shine = Math.max(0, 1 - Math.abs(i - glint) / 3);
              const c = done ? color.secondary : i < lit ? color.primary : shine > 0 ? `color-mix(in srgb, ${color.primary} ${Math.round(shine * 80)}%, ${color.fg})` : color.fg;
              return <span key={j} style={{ color: c, opacity: p }}>{ch}</span>;
            })}
          </div>
        ))}
      </div>

      {!bare && frame >= scanStart ? (
        <>
          <Arrow y={1040} p={ramp(frame, scanStart, scanStart + 8)} />
          <div style={{ ...center, top: 1090, ...text, fontSize: 130, lineHeight: 1, letterSpacing: "-0.04em", color: lit === n.length ? color.primary : color.fg }}>
            {frame < again ? running : (
              <>
                {[...s].map((d, i) => (
                  <span key={i} style={{ color: frame >= parts[i] ? color.primary : color.fg }}>{d}</span>
                ))}
              </>
            )}
          </div>
        </>
      ) : null}

      {!bare && frame >= again ? (
        <>
          <Arrow y={1228} p={ramp(frame, parts[0] - 4, parts[0] + 4)} />
          <div style={{ ...center, top: 1278, ...text, fontSize: 104, lineHeight: 1, letterSpacing: "-0.03em" }}>
            {[...s].map((d, i) => (
              <span key={i} style={{ opacity: ramp(frame, parts[i] - 2, parts[i] + 4) }}>{i ? <span style={{ color: color.fgDim }}> + </span> : null}<span style={{ color: color.primary }}>{d}</span></span>
            ))}
            <span style={{ color: color.secondary, opacity: ramp(frame, parts[s.length] - 2, parts[s.length] + 4) }}> = {s2}</span>
          </div>
        </>
      ) : null}

      {done ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 760, display: "flex", justifyContent: "center", rotate: "-7deg" }}>
          <Reveal at={yes} from="stamp">
            <div style={{
              ...text, fontSize: 84, color: color.secondary, padding: "18px 40px", borderRadius: 24, letterSpacing: "0.02em",
              background: "rgba(17,24,32,0.88)", boxShadow: `0 0 0 7px ${color.secondary}, 0 20px 40px #05090ec0`,
            }}>
              DIVISIBLE BY 9
            </div>
          </Reveal>
        </div>
      ) : null}

      {bare ? null : (
        <>
          <Sfx name="scan" at={scanStart} volume={0.14} frames={scanEnd - scanStart} loop />
          <Sfx name="ding" at={total} volume={0.16} frames={22} />
          {parts.map((at, i) => <Sfx key={i} name="click" at={at} volume={0.22} frames={6} />)}
          <Sfx name="reveal" at={yes} volume={0.26} frames={32} />
        </>
      )}
    </>
  );
};
