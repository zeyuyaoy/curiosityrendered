import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { inter } from "../brand/fonts";
import { brand, safeWidth } from "../brand/tokens";
import { toPages } from "../episode/captions";
import { FPS } from "../episode/timeline";

const HOLD_MS = 500;

export const Captions: React.FC<{ captions: Caption[]; top?: number }> = ({ captions, top = brand.layout.bodyBottom + 14 }) => {
  const ms = (useCurrentFrame() / FPS) * 1000;
  const pages = useMemo(() => toPages(captions), [captions]);
  const i = pages.findLastIndex((p) => ms >= p.startMs);
  const page = pages[i];
  if (!page || ms > Math.min(page.endMs + HOLD_MS, pages[i + 1]?.startMs ?? Infinity)) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: brand.safe.left,
        width: safeWidth,
        top,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: inter,
          fontWeight: 700,
          fontSize: brand.size.caption,
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          textAlign: "center",
          padding: "8px 22px 12px",
          borderRadius: brand.radius.md,
          background: "rgba(17,24,32,0.82)",
          whiteSpace: "nowrap",
        }}
      >
        {page.words.map((w, k) => (
          <span key={k} style={{ color: ms >= w.startMs ? brand.color.fg : brand.color.fgDim }}>
            {(k ? " " : "") + w.text}
          </span>
        ))}
      </div>
    </div>
  );
};
