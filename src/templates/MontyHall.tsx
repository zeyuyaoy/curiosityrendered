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
  <div style={{ ...panel, top: 592, opacity: ramp(local, 0, 10), translate: `0 ${20 * (1 - ramp(local, 0, 16))}px` }}>
    <div style={{ fontWeight: 700, fontSize: 39, color: dim }}>Say you picked Door 1</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 28 }}>
      {doors.map((prize) => {
        const round = playRound(prize, 1);
        const alpha = ramp(local, 5 + (prize - 1) * 4, 13 + (prize - 1) * 4);
        const accent = round.stayWins ? color.tertiary : color.primary;
        return (
          <div key={prize} style={{
            opacity: alpha, translate: `0 ${18 * (1 - alpha)}px`,
            background: color.surface, border: `2px solid ${accent}88`, borderRadius: 24,
            padding: "28px 2px 24px",
          }}>
            <div style={{ fontSize: 35, fontWeight: 700, marginBottom: 22, color: dim }}>Prize in {prize}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              {doors.map((door) => (
                <span key={door} style={{
                  display: "grid", placeItems: "center", width: 65, height: 87,
                  borderRadius: "34px 34px 7px 7px", border: `2px ${door === round.opened ? "dashed" : "solid"} ${door === round.pick ? color.primary : seam}`,
                  background: door === round.opened ? color.bg : "#253343", color: dim, fontSize: 38,
                }}>{door === prize ? <Prize size={24} /> : door === round.opened ? "×" : <span style={{ color: dim }}>•</span>}</span>
              ))}
            </div>
            <div style={{ fontSize: 39, fontWeight: 800, marginTop: 26, color: accent }}>{round.stayWins ? "Stay wins" : "Switch wins"}</div>
          </div>
        );
      })}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginTop: 32, opacity: ramp(local, 31, 49) }}>
      <div style={{ borderTop: `4px solid ${color.tertiary}`, paddingTop: 18, color: color.tertiary, fontSize: 88, fontWeight: 800 }}>1 in 3</div>
      <div style={{ borderTop: `4px solid ${color.primary}`, paddingTop: 18, color: color.primary, fontSize: 88, fontWeight: 800 }}>2 in 3</div>
    </div>
    <div style={{ color: dim, marginTop: 19, fontSize: 38, fontWeight: 700, opacity: ramp(local, 31, 49) }}>Exact odds</div>
  </div>
);

const SimulationBoard: React.FC<{ seed: number; trials: number; local: number; outro: boolean }> = ({ seed, trials, local, outro }) => {
  const { rounds } = useMemo(() => simulateMonty(seed, trials), [seed, trials]);
  const dealt = Math.floor(ramp(local, 7, 67, (t) => t) * trials);
  const stayWins = rounds.slice(0, dealt).filter((r) => r.stayWins).length;
  const switchWins = dealt - stayWins;
  return (
    <div style={{ ...panel, top: 485, opacity: ramp(local, 0, 11), translate: `0 ${22 * (1 - ramp(local, 0, 16))}px` }}>
      <div style={{
        padding: "23px 34px 30px", background: color.surface, border: `2px solid ${seam}`, borderRadius: 27,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 21, alignItems: "baseline" }}>
          <span style={{ fontSize: 39, fontWeight: 700 }}>{trials} simulated games</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: dim, ...tabular }}>{dealt} / {trials}</span>
        </div>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        {[
          { name: "Stay wins", wins: stayWins, accent: color.tertiary },
          { name: "Switch wins", wins: switchWins, accent: color.primary },
        ].map(({ name, wins, accent }) => (
          <div key={name} style={{
            background: color.surface, border: `2px solid ${accent}88`, borderRadius: 24,
            padding: "20px 4px", color: accent,
          }}>
            <div style={{ fontSize: 39, fontWeight: 800 }}>{name}</div>
            <div style={{ fontSize: 81, fontWeight: 800, letterSpacing: "-0.045em", ...tabular }}>
              {dealt === trials ? `${(100 * wins / trials).toFixed(1)}%` : wins}
            </div>
            <div style={{ fontSize: 34, color: dim, fontWeight: 700, ...tabular }}>
              {dealt === trials ? `${wins} / ${trials} games` : "wins so far"}
            </div>
          </div>
        ))}
      </div>
      {outro ? <div style={{ fontSize: 37, color: dim, marginTop: 27, fontWeight: 700 }}>Exact switch odds: 2 in 3</div> : null}
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
  const doorOpens = question + 66;
  const exit = ramp(frame, reveal - 7, reveal);
  return (
    <>
      {bare || frame < reveal ? (
        <div style={{ ...panel, top: bare ? 800 : 688, opacity: 1 - exit, translate: `0 ${-28 * exit}px` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 19 }}>
            {doors.map((door) => {
              const opening = bare || door !== example.opened ? 0 : ramp(frame, doorOpens, doorOpens + 20);
              const selected = picked && door === example.pick;
              const candidate = ask && door === example.swap;
              const sweep = bare || picked ? 0 : Math.max(0, 1 - Math.abs(frame - 8 - (door - 1) * 8) / 20);
              return <DoorPanel key={door} door={door} selected={selected} candidate={candidate}
                opening={opening} glow={selected || candidate ? 0.8 : sweep}
                label={selected ? (ask ? "Stay" : "Example pick") : candidate ? "Switch" : opening > 0.72 ? "Empty" : ""} />;
            })}
          </div>
          {!picked && !bare ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, color: dim, fontSize: 39, fontWeight: 700, marginTop: 6 }}>
              <Prize size={29} /> Hidden behind one door
            </div>
          ) : null}
          {ask ? (
            <div style={{ width: 210, height: 5, borderRadius: 4, background: seam, margin: "40px auto 0", overflow: "hidden" }}>
              <div style={{ width: `${100 * (1 - ramp(frame, think, reveal, (t) => t))}%`, height: "100%", background: color.primary }} />
            </div>
          ) : null}
        </div>
      ) : frame < simulation ? <Odds local={frame - reveal} /> : (
        <SimulationBoard seed={spec.sim.seed} trials={spec.sim.trials} local={frame - simulation} outro={frame >= outro} />
      )}
      {!bare ? (
        <>
          <Sfx name="click" at={question} volume={0.26} frames={12} />
          <Sfx name="whoosh" at={doorOpens} volume={0.23} frames={15} />
          <Sfx name="tick" at={think + 32} volume={0.17} frames={13} />
          <Sfx name="reveal" at={reveal + 4} volume={0.23} frames={32} />
          <Sfx name="scan" at={simulation + 7} volume={0.19} frames={30} />
          <Sfx name="ding" at={simulation + 67} volume={0.20} frames={23} />
        </>
      ) : null}
    </>
  );
};
