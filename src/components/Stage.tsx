import React from "react";
import { AbsoluteFill } from "remotion";
import { brand } from "../brand/tokens";

const { color, safe, layout, crops, video } = brand;

export const Stage: React.FC<{ children?: React.ReactNode; debug?: boolean }> = ({ children, debug }) => (
  <AbsoluteFill style={{ backgroundColor: color.bg, overflow: "hidden" }}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${color.muted} 1.5px, transparent 1.7px)`,
        backgroundSize: "40px 40px",
        backgroundPosition: "20px 20px",
        opacity: 0.28,
      }}
    />
    {children}
    {debug ? <SafeOverlay /> : null}
  </AbsoluteFill>
);

const band = (top: number, bottom: number, c: string, label: string) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, height: bottom - top, border: `3px dashed ${c}` }}>
    <span style={{ position: "absolute", right: 8, top: 4, color: c, font: "600 22px monospace" }}>{label}</span>
  </div>
);

export const SafeOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        inset: `${safe.top}px ${safe.right}px ${safe.bottom}px ${safe.left}px`,
        outline: "3px solid rgba(255,60,60,.8)",
      }}
    />
    {band(crops.portrait.top, crops.portrait.bottom, "rgba(255,200,0,.7)", "3:4 grid crop")}
    {band(crops.square.top, crops.square.bottom, "rgba(0,200,255,.7)", "1:1 crop")}
    {band(layout.headlineTop, layout.headlineBottom, "rgba(160,255,160,.5)", "headline")}
    {band(layout.bodyTop, layout.bodyBottom, "rgba(160,255,160,.5)", "experiment")}
    <span style={{ position: "absolute", left: 8, top: video.height - safe.bottom + 6, color: "red", font: "600 22px monospace" }}>
      Reels UI
    </span>
  </AbsoluteFill>
);
