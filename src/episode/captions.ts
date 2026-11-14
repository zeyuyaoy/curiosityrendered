import type { Caption } from "@remotion/captions";
import type { TimedBeat } from "./timeline";
import { FPS } from "./timeline";

type Word = { text: string; startMs: number; endMs: number };

export type Timings = {
  audio: string;
  sampleRate: number;
  fingerprint?: string;
  beats: { id: string; start: number; audioSeconds: number; words: Word[] | null }[];
};

const LEAD_S = 0.42;
const words = (s: string) => s.split(/\s+/).filter(Boolean);

export const buildCaptions = (beats: TimedBeat[], timings: Timings | null): Caption[] => {
  const out: Caption[] = [];
  for (const b of beats) {
    const shown = words(b.narration);
    if (!shown.length) continue;
    const t = timings?.beats.find((x) => x.id === b.id);
    let ws: Word[];
    if (t?.words && t.words.length === shown.length) {
      ws = t.words.map((w, i) => ({ ...w, text: shown[i] }));
    } else if (t?.words) {
      ws = t.words;
    } else {
      const start = (t ? t.start : b.from / FPS + LEAD_S) * 1000;
      const span = Math.min(t ? t.audioSeconds * 1000 : (shown.length / 2.8) * 1000, ((b.from + b.duration) / FPS - 0.1) * 1000 - start);
      const weight = shown.map((w) => w.length + 3);
      const total = weight.reduce((a, c) => a + c, 0);
      let acc = 0;
      ws = shown.map((text, i) => {
        const s = start + (acc / total) * span;
        acc += weight[i];
        return { text, startMs: s, endMs: start + (acc / total) * span };
      });
    }
    for (const w of ws)
      out.push({ text: w.text, startMs: Math.round(w.startMs), endMs: Math.round(w.endMs), timestampMs: null, confidence: null });
    out[out.length - 1].pageBreakAfter = true;
  }
  return out;
};

export type Page = { startMs: number; endMs: number; words: Caption[] };

const MAX_CHARS = 30;
const text = (ws: Caption[]) => ws.map((x) => x.text).join(" ");

export const toPages = (caps: Caption[]): Page[] => {
  const groups: Caption[][] = [];
  let cur: Caption[] = [];
  caps.forEach((c, i) => {
    cur.push(c);
    const next = caps[i + 1];
    const nextChars = next ? text(cur).length + 1 + next.text.length : Infinity;
    const number = /^\d+%?$/.test(c.text);
    const punct = /[.,:;?!]$/.test(c.text);
    if (c.pageBreakAfter || nextChars > MAX_CHARS || (!number && (punct || cur.length >= 6))) {
      groups.push(cur);
      cur = [];
    }
  });
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const prev = groups[i - 1];
    if (g.length !== 1 || !prev || prev.at(-1)!.pageBreakAfter) continue;
    if (text([...prev, ...g]).length <= MAX_CHARS) {
      prev.push(...g), groups.splice(i--, 1);
    } else if (prev.length >= 3 && !/^\d+%?$/.test(prev.at(-2)!.text)) {
      g.unshift(prev.pop()!);
    }
  }
  return groups.map((ws) => ({ startMs: ws[0].startMs, endMs: ws.at(-1)!.endMs, words: ws }));
};
