import React from "react";
import { useCurrentFrame } from "remotion";
import { enter, leave } from "./motion";

export const Reveal: React.FC<{
  at: number;
  until?: number;
  from?: "pop" | "up" | "stamp";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, until, from = "pop", style, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = from === "stamp" ? enter(frame, at, 11, 260) : enter(frame, at);
  const o = until === undefined ? 1 : leave(frame, until);
  const t =
    from === "up"
      ? `translateY(${(1 - p) * 50}px)`
      : from === "stamp"
        ? `scale(${1.6 - 0.6 * p}) rotate(${(1 - p) * -8}deg)`
        : `scale(${0.9 + 0.1 * p})`;
  return (
    <div style={{ opacity: Math.min(1, p * 1.4) * o, transform: t, filter: `blur(${(1 - Math.min(1, p)) * 10}px)`, ...style }}>
      {children}
    </div>
  );
};
