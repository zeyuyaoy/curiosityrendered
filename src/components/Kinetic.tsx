import React from "react";
import { useCurrentFrame } from "remotion";
import { inter } from "../brand/fonts";
import { brand } from "../brand/tokens";
import { enter, leave } from "./motion";

export const Kinetic: React.FC<{ text: string; at: number; until?: number; size: number; align?: "left" | "center" }> = ({
  text,
  at,
  until,
  size,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const out = until === undefined ? 1 : leave(frame, until, 8);
  let n = 0;
  let open: string | null = null;
  const lines = text.split("\n").map((l) =>
    l.split(/\s+/).filter(Boolean).map((raw) => {
      let w = raw;
      const mark = open ?? (/^[*~]/.test(w) ? w[0] : null);
      if (!open && mark) w = w.slice(1);
      const end = mark && new RegExp(`\\${mark}([^\\w*~]*)$`);
      const closes = !!end && end.test(w);
      if (end && closes) w = w.replace(end, "$1");
      open = mark && !closes ? mark : null;
      return { w, i: n++, accent: mark === "*" ? brand.color.primary : mark === "~" ? brand.color.secondary : undefined };
    }),
  );
  return (
    <div
      style={{
        fontFamily: inter,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: "-0.035em",
        color: brand.color.fg,
        textAlign: align,
        textWrap: "balance",
        opacity: out,
      }}
    >
      {lines.map((line, li) => (
        <div key={li}>
          {line.map(({ w, i, accent }) => {
        const p = enter(frame, at + i * 2, 15, 190);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              color: accent,
              opacity: Math.min(1, p * 1.6),
              transform: `translateY(${(1 - p) * 0.5 * size}px)`,
            }}
          >
            {w}
          </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
