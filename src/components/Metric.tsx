import React from "react";
import { inter, tabular } from "../brand/fonts";
import { brand } from "../brand/tokens";

export const Metric: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color = brand.color.fg }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 10, whiteSpace: "nowrap", flexShrink: 0 }}>
    <span style={{ fontFamily: inter, fontWeight: 600, fontSize: 32, color: brand.color.fgDim }}>{label}</span>
    <span style={{ fontFamily: inter, fontWeight: 800, fontSize: brand.size.label, color, ...tabular }}>{value}</span>
  </div>
);
