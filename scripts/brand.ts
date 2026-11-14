import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Mark, type MarkTheme } from "../src/brand/Logo";
import { bundled, ROOT } from "./lib";

const out = path.join(ROOT, "brand/assets");
mkdirSync(out, { recursive: true });

const svgs: [string, MarkTheme][] = [
  ["logo.svg", "dark"],
  ["logo-transparent.svg", "transparent"],
  ["logo-light.svg", "light"],
];
for (const [file, theme] of svgs)
  writeFileSync(path.join(out, file), renderToStaticMarkup(React.createElement(Mark, { size: 1024, theme })) + "\n");

const serveUrl = await bundled();
const stills: [string, string, number][] = [
  ["profile", "profile-1024.png", 1],
  ["profile", "profile-256.png", 0.25],
  ["logo-sizes", "legibility-32-48-64.png", 1],
];
for (const [id, file, scale] of stills) {
  const composition = await selectComposition({ serveUrl, id, inputProps: {} });
  await renderStill({ composition, serveUrl, output: path.join(out, file), scale, imageFormat: "png" });
}
console.log(`\u2714 brand/assets: ${[...svgs.map((s) => s[0]), ...stills.map((s) => s[1])].join(", ")}`);
