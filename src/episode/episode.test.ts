import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import { episodes } from "../episodes";
import { buildCaptions, toPages } from "./captions";
import { lintEpisode } from "./lint";
import { resolveEpisode } from "./resolve";
import { RUN, runWindow, share } from "../sims/compute";
import { EpisodeSpec } from "./schema";
import { FPS, toTimeline } from "./timeline";

const maze = episodes.find((e) => (e as { id: string }).id === "three-algorithms-one-maze")!;

describe("episode specs", () => {
  it.each(episodes.map((e) => [(e as { id: string }).id, e]))("%s lints clean", (_, e) => {
    expect(lintEpisode(e).errors).toEqual([]);
  });

  it("lint catches bad specs", () => {
    const bad = structuredClone(maze) as Record<string, any>;
    bad.hook = "this hook is far too long to ever fit on three short lines";
    bad.beats[2].narration = "Mystery {nope.fact} " + "word ".repeat(40);
    bad.beats.pop();
    const { errors } = lintEpisode(bad);
    const text = errors.join("\n");
    expect(text).toMatch(/hook/);
    expect(text).toMatch(/unknown placeholder \{nope\.fact\}/);
    expect(text).toMatch(/words\/s/);
    expect(text).toMatch(/last beat must be "outro"/);
    expect(lintEpisode({ id: "x" }).errors.length).toBeGreaterThan(0);
  });
});

describe("maze: mathematical guarantees (must hold for any correct implementation)", () => {
  const { facts, maze: m } = resolveEpisode(EpisodeSpec.parse(maze));
  const r = m!.results;
  it("A* with an admissible heuristic finds a shortest route; greedy can't beat it", () => {
    expect(r.astar.pathLength).toBe(r.bfs.pathLength);
    expect(r.greedy.pathLength).toBeGreaterThanOrEqual(r.bfs.pathLength);
  });
  it("every number the copy quotes is derived from the counts, not typed in", () => {
    expect(facts["greedy.extra"]).toBe(r.greedy.pathLength - r.bfs.pathLength);
    expect(facts["astar.savedPct"]).toBe(Math.round((100 * (r.bfs.expanded - r.astar.expanded)) / r.bfs.expanded));
    expect(facts["astar.searchShare"]).toBe(share(r.astar.expanded, r.bfs.expanded));
  });
  it("plain-language shares round to the nearest familiar fraction", () => {
    expect(share(121, 238)).toBe("about half");
    expect(share(152, 238)).toBe("about two thirds of");
    expect(share(1, 3)).toBe("about a third of");
    expect(share(238, 248)).toBe("nearly all");
    expect(share(5, 5)).toBe("all");
  });
});

describe("maze episode: script claims match this simulation", () => {
  const { timeline, maze: m } = resolveEpisode(EpisodeSpec.parse(maze));
  const r = m!.results;
  it('"Greedy checked the fewest squares, but took a detour"', () => {
    expect(r.greedy.expanded).toBeLessThan(Math.min(r.astar.expanded, r.bfs.expanded));
    expect(r.greedy.pathLength).toBeGreaterThan(r.bfs.pathLength);
  });
  it('"A* found the shortest route with [a share of] BFS\'s checking"', () => {
    expect(r.astar.expanded).toBeLessThan(r.bfs.expanded);
  });
  it("each run fills in the same screen time and finishes drawing its route inside its own beat", () => {
    for (const a of ["bfs", "greedy", "astar"] as const) {
      const b = timeline.beats.find((x) => x.id === a)!;
      const w = runWindow(b, r[a].expanded);
      expect(w.filled - w.start).toBe(RUN.fill);
      expect(w.start).toBeGreaterThanOrEqual(b.from);
      expect(w.routeDone).toBeLessThan(b.from + b.duration);
    }
  });
});

describe("timeline and captions", () => {
  const { timeline } = resolveEpisode(EpisodeSpec.parse(maze));
  it("beats tile the video exactly", () => {
    timeline.beats.forEach((b, i) => i && expect(b.from).toBe(timeline.beats[i - 1].from + timeline.beats[i - 1].duration));
    const seconds = timeline.beats.reduce((s, b) => s + b.seconds, 0);
    expect(timeline.durationInFrames).toBe(Math.round(seconds * FPS));
    expect(toTimeline([{ id: "a", seconds: 1 / 3, narration: "" }, { id: "b", seconds: 1 / 3, narration: "" }, { id: "c", seconds: 1 / 3, narration: "" }]).durationInFrames).toBe(30);
  });
  it("estimated captions stay inside their beats; pages stay short", () => {
    const caps = buildCaptions(timeline.beats, null);
    for (const b of timeline.beats) {
      const n = b.narration.split(/\s+/).filter(Boolean).length;
      const mine = caps.filter((c) => c.startMs >= (b.from / FPS) * 1000 && c.endMs <= ((b.from + b.duration) / FPS) * 1000);
      expect(mine.length).toBe(n);
    }
    for (const p of toPages(caps)) expect(p.words.map((w) => w.text).join(" ").length).toBeLessThanOrEqual(30);
  });
  it("TTS timings keep display words (lexicon) when token counts match", () => {
    const b = timeline.beats.find((x) => x.id === "astar")!;
    const words = b.narration.split(/\s+/).map((t, i) => ({ text: t === "A*" ? "A-star" : t, startMs: 1000 + i * 100, endMs: 1090 + i * 100 }));
    const caps = buildCaptions([b], { audio: "x.wav", sampleRate: 48000, beats: [{ id: b.id, start: 0, audioSeconds: 1, words }] });
    expect(caps[0].text).toBe("A*");
    expect(caps[0].startMs).toBe(1000);
  });
  it("captions without word timings start with the recorded audio and stay inside the beat", () => {
    const b = timeline.beats.find((x) => x.id === "astar")!;
    const start = b.from / FPS + 0.12;
    const caps = buildCaptions([b], { audio: "x.wav", sampleRate: 48000, beats: [{ id: b.id, start, audioSeconds: 60, words: null }] });
    expect(caps[0].startMs).toBe(Math.round(start * 1000));
    expect(caps.at(-1)!.endMs).toBeLessThanOrEqual(((b.from + b.duration) / FPS) * 1000);
  });
});

describe("layout and determinism", () => {
  const { layout, safe, video, crops } = brand;
  it("shared zones sit inside the Reels safe area and the 1:1 grid crop", () => {
    expect(layout.bodyBottom + 14 + 80).toBeLessThanOrEqual(video.height - safe.bottom);
    expect(layout.headlineTop).toBeGreaterThanOrEqual(safe.top);
    expect(layout.headlineTop).toBeLessThan(layout.headlineBottom);
    expect(layout.headlineBottom).toBeLessThanOrEqual(layout.bodyTop);
    expect(crops.square.top).toBeLessThanOrEqual(layout.bodyTop);
    expect(crops.square.bottom).toBeGreaterThanOrEqual(layout.bodyBottom);
  });
  it("render code never uses unseeded randomness or wall-clock time", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = path.join(dir, f);
        return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
      });
    for (const f of files(path.resolve(import.meta.dirname, ".."))) expect(readFileSync(f, "utf8"), f).not.toMatch(/Math\.random|Date\.now|new Date\(/);
  });
});
