export const brand = {
  name: "Curiosity Rendered",
  handle: "@curiosityrendered",
  tagline: "Weird questions. Unexpected outcomes.",
  color: {
    bg: "#111820",
    fg: "#F7F8FA",
    primary: "#28E0DE",
    secondary: "#FFB454",
    tertiary: "#8A7CFF",
    muted: "#53616D",
    fgDim: "rgba(247,248,250,0.66)",
    surface: "#18222D",
  },
  font: "Inter",
  size: { hook: 80, headline: 62, body: 46, caption: 50, label: 38, note: 30 },
  radius: { sm: 10, md: 20, lg: 36 },
  video: { width: 1080, height: 1920, fps: 30 },
  safe: { top: 220, bottom: 400, left: 64, right: 120 },
  layout: { headlineTop: 268, headlineBottom: 528, bodyTop: 560, bodyBottom: 1420 },
  crops: { portrait: { top: 240, bottom: 1680 }, square: { top: 420, bottom: 1500 } },
} as const;

export const safeWidth = brand.video.width - brand.safe.left - brand.safe.right;
