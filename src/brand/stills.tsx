import React from "react";
import { AbsoluteFill } from "remotion";
import { Stage } from "../components/Stage";
import { Episode, type EpisodeProps } from "../episode/Episode";
import { resolveEpisode } from "../episode/resolve";
import { EpisodeSpec } from "../episode/schema";
import { inter } from "./fonts";
import { Mark } from "./Logo";
import { brand, safeWidth } from "./tokens";

const { color, crops, safe } = brand;

export const Profile: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: color.bg }}>
    <Mark size={1024} style={{ width: "100%", height: "100%" }} />
  </AbsoluteFill>
);

export const LogoSizes: React.FC = () => (
  <AbsoluteFill style={{ flexDirection: "row" }}>
    {(["dark", "light"] as const).map((theme) => (
      <div
        key={theme}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 28, background: theme === "dark" ? "#000" : "#fff" }}
      >
        {[32, 48, 64, 128].map((s) => (
          <Mark key={s} size={s} theme={theme} />
        ))}
      </div>
    ))}
  </AbsoluteFill>
);

export const coverFrame = (spec: EpisodeProps["spec"]) => {
  const r = resolveEpisode(EpisodeSpec.parse(spec));
  const beats = r.timeline.beats;
  const at = beats.find((b) => b.id === r.spec.cover.beat) ?? beats[Math.floor(beats.length / 2)];
  return at.from + at.duration - 1;
};

export const Cover: React.FC<Pick<EpisodeProps, "spec" | "debug">> = ({ spec, debug }) => {
  const r = resolveEpisode(EpisodeSpec.parse(spec));
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg }}>
      <Episode spec={spec} timings={null} bare />
      <div style={{ position: "absolute", left: safe.left, top: safe.top + 30 }}>
        <Mark size={72} />
      </div>
      <div
        style={{
          position: "absolute",
          left: safe.left,
          width: safeWidth,
          top: crops.square.top + 10,
          fontFamily: inter,
          fontWeight: 800,
          fontSize: Math.min(124, Math.floor(safeWidth / (Math.max(...r.spec.cover.headline.split("\n").map((l) => l.length)) * 0.66))),
          whiteSpace: "pre",
          lineHeight: 1,
          letterSpacing: "-0.045em",
          color: color.fg,
        }}
      >
        {r.spec.cover.headline}
      </div>
      {r.spec.cover.sub ? (
        <div
          style={{
            position: "absolute",
            left: safe.left,
            width: safeWidth,
            top: brand.layout.bodyBottom + 6,
            fontFamily: inter,
            fontWeight: 600,
            fontSize: 40,
            color: color.fgDim,
          }}
        >
          {r.spec.cover.sub}
        </div>
      ) : null}
      {debug ? <Stage debug /> : null}
    </AbsoluteFill>
  );
};
