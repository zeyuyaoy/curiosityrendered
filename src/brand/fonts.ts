import type React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";

export const inter = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;

export const tabular: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
