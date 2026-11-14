import React from "react";
import { brand } from "./tokens";

const C = { x: 47, y: 50, r: 23, stroke: 14, gap: 48 };
const ORBIT = 36;
const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: +(C.x + r * Math.cos(a)).toFixed(2), y: +(C.y - r * Math.sin(a)).toFixed(2) };
};
const a0 = pt(C.gap, C.r);
const a1 = pt(-C.gap, C.r);
const ARC = `M ${a0.x} ${a0.y} A ${C.r} ${C.r} 0 1 0 ${a1.x} ${a1.y}`;
const ARC_LEN = 2 * Math.PI * C.r * (1 - (2 * C.gap) / 360);

export type MarkTheme = "dark" | "light" | "transparent";

const themes = {
  dark: { disc: brand.color.bg, c: brand.color.primary, moon: brand.color.secondary, dot: brand.color.fg },
  transparent: { disc: "none", c: brand.color.primary, moon: brand.color.secondary, dot: brand.color.fg },
  light: { disc: brand.color.fg, c: brand.color.bg, moon: brand.color.secondary, dot: brand.color.primary },
};

export const Mark: React.FC<{
  size?: number;
  theme?: MarkTheme;
  draw?: number;
  orbit?: number;
  moons?: number;
  style?: React.CSSProperties;
}> = ({ size = 100, theme = "dark", draw = 1, orbit = 0, moons = 1, style }) => {
  const t = themes[theme];
  const moon = pt(38 + orbit, ORBIT);
  const dot = pt(218 + orbit, ORBIT);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 100 100" style={style}>
      {t.disc === "none" ? null : <circle cx={50} cy={50} r={50} fill={t.disc} />}
      <path
        d={ARC}
        fill="none"
        stroke={t.c}
        strokeWidth={C.stroke}
        strokeLinecap="round"
        strokeDasharray={draw === 1 ? undefined : ARC_LEN}
        strokeDashoffset={draw === 1 ? undefined : ARC_LEN * (1 - draw)}
      />
      {moons > 0 ? (
        <>
          <circle cx={moon.x} cy={moon.y} r={+(7.5 * moons).toFixed(2)} fill={t.moon} />
          <circle cx={dot.x} cy={dot.y} r={+(4.2 * moons).toFixed(2)} fill={t.dot} />
        </>
      ) : null}
    </svg>
  );
};
