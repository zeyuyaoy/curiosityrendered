import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { inter, tabular } from "../brand/fonts";
import { brand, safeWidth } from "../brand/tokens";
import { ramp } from "../components/motion";
import { Sfx } from "../components/Sfx";
import { useBeatStart, useEpisode } from "../episode/context";
import { doors, playRound, simulateMonty, type Door } from "../sims/monty";

const { color, safe } = brand;
const example = playRound(2, 1);
const dim = "#B6C2CF";
const seam = "#374656";
const sampleComplete = 34;
const panel: React.CSSProperties = {
  position: "absolute",
  left: safe.left,
  width: safeWidth,
  fontFamily: inter,
  color: color.fg,
  textAlign: "center",
};
const accentFor = (door: Door) => [color.primary, color.secondary, color.tertiary][door - 1];

const Prize: React.FC<{ size: number }> = ({ size }) => (
  <span style={{
    display: "inline-block",
    width: size,
    height: size,
    background: color.secondary,
    rotate: "45deg",
    borderRadius: size * 0.12,
    boxShadow: `0 0 ${size}px #FFB45460, inset 0 0 0 ${Math.round(size * 0.12)}px #FFE1B866`,
  }} />
);

const DoorPanel: React.FC<{ door: Door; selected: boolean; candidate: boolean; opening: number; glow: number; label: string }> = ({
  door, selected, candidate, opening, glow, label,
}) => {
  const accent = accentFor(door);
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        position: "relative",
        height: 370,
        padding: 16,
        border: `3px solid ${selected || candidate ? accent : seam}`,
        borderRadius: "134px 134px 22px 22px",
        background: "#263341",
        boxShadow: `0 18px 32px #060B12A0, 0 0 ${26 * glow}px ${accent}55`,
      }}>
        <div style={{
          position: "relative",
          height: "100%",
          overflow: "hidden",
          perspective: 680,
          borderRadius: "116px 116px 11px 11px",
          background: "radial-gradient(at 50% 59%, #192536, #0B1017 73%)",
          boxShadow: "inset 0 0 0 3px #0C141D",
        }}>
          {opening > 0 ? (
            <div style={{
              position: "absolute", inset: "47% 0 auto", color: dim, fontSize: 83,
              fontWeight: 500, opacity: ramp(opening, 0.34, 0.82),
            }}>×</div>
          ) : null}
          <div style={{
            position: "absolute", inset: 0, transformOrigin: "left",
            transform: `rotateY(${-105 * opening}deg)`,
            background: `linear-gradient(154deg, ${accent}38, #182331 60%, #121A26)`,
            border: `3px solid ${accent}`,
            borderRadius: "inherit",
            boxShadow: `inset 0 0 0 12px #0B111A55, inset 0 -34px 54px ${accent}25`,
          }}>
            <div style={{
              position: "absolute", inset: "24% 17% 34%",
              border: `2px solid ${accent}55`, borderRadius: "60px 60px 10px 10px",
              display: "grid", placeItems: "center", color: accent, fontWeight: 800, fontSize: 92, ...tabular,
            }}>{door}</div>
            <div style={{
              position: "absolute", right: 23, top: "65%", width: 16, height: 16,
              background: accent, borderRadius: "50%", boxShadow: `0 0 16px ${accent}88`,
            }} />
            <div style={{
              position: "absolute", inset: "auto 27% 13%", height: 4,
              background: accent, borderRadius: 4, opacity: 0.55 + 0.45 * glow,
            }} />
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 24, height: 58, display: "grid", placeItems: "center",
        color: selected || candidate ? accent : dim, fontSize: 36, fontWeight: 800,
      }}>{label}</div>
    </div>
  );
};

const Odds: React.FC<{ local: number }> = ({ local }) => (
  <div style={{ ...panel, top: 478 }}>
    <div style={{ fontWeight: 700, fontSize: 50, color: dim }}>Your pick in every case: Door {example.pick}</div>
    <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
      {doors.map((prize, i) => {
        const round = playRound(prize, example.pick);
        const at = [0, 70, 108][i];
        const alpha = ramp(local, at, at + 9);
        const accent = round.stayWins ? color.tertiary : color.primary;
        return (
          <div key={prize} style={{
            opacity: alpha, translate: `0 ${16 * (1 - alpha)}px`,
            display: "flex", alignItems: "center", gap: 46, textAlign: "left",
            background: color.surface, border: `2px solid ${accent}88`, borderRadius: 24,
            padding: "24px 28px",
          }}>
            <div style={{ display: "flex", gap: 14 }}>
              {doors.map((door) => (
                <span key={door} style={{
                  display: "grid", placeItems: "center", width: 100, height: 132,
                  borderRadius: "52px 52px 11px 11px",
                  border: `3px ${door === round.opened ? "dashed" : "solid"} ${door === round.pick ? color.primary : seam}`,
                  background: door === round.opened ? color.bg : "#253343", color: dim, fontSize: 52, fontWeight: 700,
                }}>{door === prize ? <Prize size={34} /> : door === round.opened ? "×" : door}</span>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 49, fontWeight: 600, color: dim }}>Prize in Door {prize}</div>
              <div style={{ fontSize: 67, fontWeight: 800, color: accent }}>{round.stayWins ? "Stay wins" : "Switch wins"}</div>
            </div>
          </div>
        );
      })}
    </div>
    <div style={{ marginTop: 25, opacity: ramp(local, 135, 145) }}>
      <div style={{ color: dim, fontSize: 48, fontWeight: 700 }}>Exact odds</div>
      <div style={{ display: "flex", justifyContent: "space-around", gap: 24, fontSize: 63, fontWeight: 800 }}>
        <span style={{ color: color.tertiary }}>Stay 1 in 3</span>
        <span style={{ color: color.primary }}>Switch 2 in 3</span>
      </div>
    </div>
  </div>
);

const SimulationBoard: React.FC<{ seed: number; trials: number; local: number }> = ({ seed, trials, local }) => {
  const { rounds, stayWins, switchWins } = useMemo(() => simulateMonty(seed, trials), [seed, trials]);
  const dealt = Math.floor(ramp(local, 3, sampleComplete, (t) => t) * trials);
  return (
    <div style={{ ...panel, top: 478, opacity: ramp(local, 0, 8) }}>
      <div style={{ fontSize: 50, fontWeight: 700, color: dim, marginBottom: 24 }}>Observed win rates · {trials} games</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, opacity: ramp(local, sampleComplete - 3, sampleComplete + 4) }}>
        {[
          { name: "Stay", wins: stayWins, accent: color.tertiary },
          { name: "Switch", wins: switchWins, accent: color.primary },
        ].map(({ name, wins, accent }) => (
          <div key={name} style={{
            background: color.surface, border: `2px solid ${accent}88`, borderRadius: 24,
            padding: "24px 4px", color: accent,
          }}>
            <div style={{ fontSize: 55, fontWeight: 800 }}>{name}</div>
            <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: "-0.045em", ...tabular }}>
              {(100 * wins / trials).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      <div style={{
        padding: 28, marginTop: 18, background: color.surface, border: `2px solid ${seam}`, borderRadius: 27,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: "10px 15px" }}>
          {rounds.map((round, i) => {
            const active = i < dealt;
            const accent = round.stayWins ? color.tertiary : color.primary;
            return <span key={i} style={{
              height: 24, borderRadius: 5, background: active ? accent : "#303E4D",
              opacity: active ? 0.92 : 0.8,
            }} />;
          })}
        </div>
      </div>
    </div>
  );
};

export const MontyHall: React.FC = () => {
  const frame = useCurrentFrame();
  const { spec, bare } = useEpisode();
  const question = useBeatStart("question");
  const think = useBeatStart("think");
  const reveal = useBeatStart("reveal");
  const simulation = useBeatStart("simulation");
  const outro = useBeatStart("outro");
  if (spec.template !== "monty-hall") return null;

  const picked = !bare && frame >= question;
  const ask = !bare && frame >= think;
  const doorOpens = question + 16;
  const exit = ramp(frame, reveal - 7, reveal);
  return (
    <>
      {bare || frame < reveal ? (
        <div style={{ ...panel, top: bare ? 800 : 688, opacity: 1 - exit, translate: `0 ${-28 * exit}px` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 19 }}>
            {doors.map((door) => {
              const opening = bare || door !== example.opened ? 0 : ramp(frame, doorOpens, doorOpens + 16);
              const selected = picked && door === example.pick;
              const candidate = ask && door === example.swap;
              const sweep = bare || picked ? 0 : Math.max(0, 1 - Math.abs(frame - 8 - (door - 1) * 8) / 20);
              return <DoorPanel key={door} door={door} selected={selected} candidate={candidate}
                opening={opening} glow={selected || candidate ? 0.8 : sweep}
                label={selected ? (ask ? "Stay" : "Example pick") : candidate ? "Switch" : opening > 0.72 ? "Empty" : ""} />;
            })}
          </div>
          {ask ? (
            <div style={{ width: 210, height: 5, borderRadius: 4, background: seam, margin: "40px auto 0", overflow: "hidden" }}>
              <div style={{ width: `${100 * (1 - ramp(frame, think, reveal, (t) => t))}%`, height: "100%", background: color.primary }} />
            </div>
          ) : null}
        </div>
      ) : frame < simulation ? <Odds local={frame - reveal} /> : frame < outro ? (
        <SimulationBoard seed={spec.sim.seed} trials={spec.sim.trials} local={frame - simulation} />
      ) : (
        <div style={{ ...panel, top: 625 }}>
          <div style={{ color: dim, fontSize: 48, fontWeight: 700 }}>Exact odds</div>
          <div style={{ fontSize: 82, fontWeight: 800, marginTop: 18 }}>Switching wins</div>
          <div style={{ color: color.primary, fontSize: 162, fontWeight: 800, letterSpacing: "-0.045em" }}>2 out of 3</div>
        </div>
      )}
      {!bare ? (
        <>
          <Sfx name="click" at={question} volume={0.26} frames={12} />
          <Sfx name="whoosh" at={doorOpens} volume={0.23} frames={15} />
          <Sfx name="tick" at={think + 32} volume={0.17} frames={13} />
          <Sfx name="reveal" at={reveal + 4} volume={0.23} frames={32} />
          <Sfx name="scan" at={simulation + 7} volume={0.19} frames={30} />
          <Sfx name="ding" at={simulation + sampleComplete} volume={0.20} frames={23} />
        </>
      ) : null}
    </>
  );
};
