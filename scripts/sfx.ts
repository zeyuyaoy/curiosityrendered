import { mkdirSync, writeFileSync } from "node:fs";

const SR = 48000;
let seed = 0x5eed;
const noise = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
};
const render = (seconds: number, f: (t: number) => number) => Float32Array.from({ length: Math.round(seconds * SR) }, (_, i) => f(i / SR));
const sine = (hz: number, t: number) => Math.sin(2 * Math.PI * hz * t);
const env = (t: number, attack: number, decay: number) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

const wav = (x: Float32Array) => {
  const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
  x.forEach((v, i) => b.writeInt16LE(Math.round((v / peak) * 0.8 * 32767), 44 + i * 2));
  return b;
};

let lp = 0;
const kit = {
  click: render(0.06, (t) => env(t, 0.001, 0.008) * (0.7 * sine(2400, t) + 0.3 * noise())),
  tick: render(0.12, (t) => env(t, 0.002, 0.03) * sine(1320, t)),
  whoosh: render(0.45, (t) => {
    const a = Math.sin(Math.PI * Math.min(1, t / 0.45)) ** 2;
    lp += (0.02 + 0.18 * (t / 0.45)) * (noise() - lp);
    return a * lp;
  }),
  ding: render(0.7, (t) => env(t, 0.003, 0.18) * (sine(988, t) + 0.35 * sine(1976, t) + 0.12 * sine(2964, t))),
  reveal: render(1.1, (t) =>
    [523.25, 659.25, 783.99].reduce((s, hz, k) => s + (t > k * 0.07 ? env(t - k * 0.07, 0.01, 0.35) * sine(hz, t) : 0), 0),
  ),
  scan: render(1, (t) => {
    const p = t % (1 / 12);
    return env(p, 0.001, 0.012) * (sine(1760, p) + 0.4 * sine(2640, p));
  }),
  bed: render(4, (t) => (0.7 + 0.3 * Math.cos(Math.PI * t)) * (sine(220, t) + 0.5 * sine(277.5, t) + 0.4 * sine(330, t) + 0.15 * sine(440, t))),
};

mkdirSync("public/sfx", { recursive: true });
for (const [name, x] of Object.entries(kit)) writeFileSync(`public/sfx/${name}.wav`, wav(x));
console.log(`wrote ${Object.keys(kit).length} cues to public/sfx/`);
