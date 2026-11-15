import type { EpisodeSpec } from "../episode/schema";
import type { Facts } from "./compute";

// --- Fibonacci -------------------------------------------------------------

export const fibonacci = (n: number) => {
  const f = [1, 1];
  while (f.length < n) f.push(f.at(-1)! + f.at(-2)!);
  return f.slice(0, n);
};

export type Tile = { x: number; y: number; s: number; arc: { cx: number; cy: number; from: [number, number]; to: [number, number] } };

// Squares of side F1..Fn, each placed on the next side of the growing rectangle (right, up, left, down; y points down).
// Each square carries the quarter arc that continues the spiral from the previous square's arc.
export const fibonacciTiles = (n: number) => {
  const tiles: Tile[] = [];
  for (const [i, s] of fibonacci(n).entries()) {
    const turn = i % 4;
    const box = tilesBox(tiles, i);
    const [x, y] =
      i === 0 ? [0, 0]
      : turn === 1 ? [box.x + box.w, box.y]
      : turn === 2 ? [box.x, box.y - s]
      : turn === 3 ? [box.x - s, box.y]
      : [box.x, box.y + box.h];
    const [cx, cy] = [[x + s, y], [x, y], [x, y + s], [x + s, y + s]][turn];
    const from = [[cx - s, cy], [cx, cy + s], [cx + s, cy], [cx, cy - s]][turn] as [number, number];
    const to = [[cx, cy + s], [cx + s, cy], [cx, cy - s], [cx - s, cy]][turn] as [number, number];
    tiles.push({ x, y, s, arc: { cx, cy, from, to } });
  }
  return { tiles, box: tilesBox(tiles, n) };
};

// Bounding box of the first k tiles.
export const tilesBox = (tiles: Tile[], k: number) => {
  const t = tiles.slice(0, k);
  if (!t.length) return { x: 0, y: 0, w: 0, h: 0 };
  const x = Math.min(...t.map((a) => a.x)), y = Math.min(...t.map((a) => a.y));
  return { x, y, w: Math.max(...t.map((a) => a.x + a.s)) - x, h: Math.max(...t.map((a) => a.y + a.s)) - y };
};

// --- Handshakes ------------------------------------------------------------

// Every unordered pair once, grouped by the lower-numbered guest: guest 1 greets everyone after them, then guest 2, ...
export const handshakes = (guests: number) => {
  const groups = Array.from({ length: guests - 1 }, (_, i) =>
    Array.from({ length: guests - 1 - i }, (_, k) => [i, i + 1 + k] as const));
  const running = groups.reduce<number[]>((acc, g) => [...acc, (acc.at(-1) ?? 0) + g.length], []);
  return { groups, pairs: groups.flat(), running };
};

// --- Coins -----------------------------------------------------------------

export const greedyCoins = (coins: number[], target: number) => {
  const picked: number[] = [];
  let left = target;
  for (const c of [...coins].sort((a, b) => b - a)) while (c <= left) picked.push(c), (left -= c);
  return left === 0 ? picked : null;
};

// Dynamic programming over every amount 0..target: best[a] = fewest coins summing to a.
export const fewestCoins = (coins: number[], target: number) => {
  const best: (number[] | null)[] = [[]];
  for (let a = 1; a <= target; a++) {
    best[a] = null;
    for (const c of coins) {
      const prev = c <= a ? best[a - c] : null;
      if (prev && (!best[a] || prev.length + 1 < best[a]!.length)) best[a] = [...prev, c].sort((x, y) => y - x);
    }
  }
  return best;
};

// Independent check: enumerate every multiset of coins (as counts per denomination) that sums to target.
export const allWays = (coins: number[], target: number): number[][] => {
  if (!coins.length) return target === 0 ? [[]] : [];
  const [c, ...rest] = coins;
  return Array.from({ length: Math.floor(target / c) + 1 }, (_, n) =>
    allWays(rest, target - n * c).map((w) => [...Array(n).fill(c), ...w])).flat();
};

// --- Digit sums ------------------------------------------------------------

// Seeded xorshift32 digits; the last digit is then chosen so the digit sum is a multiple of 9.
export const divisibleNumber = (seed: number, length: number) => {
  let state = seed >>> 0 || 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % 10;
  };
  const digits = Array.from({ length: length - 1 }, (_, i) => (i === 0 ? 1 + (next() % 9) : next()));
  const partial = digits.reduce((a, d) => a + d, 0);
  digits.push((9 - (partial % 9)) % 9);
  return digits.join("");
};

export const digitSum = (n: string) => [...n].reduce((a, d) => a + Number(d), 0);
export const groupThousands = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const digitChain = (n: string) => {
  const chain = [n];
  while (chain.at(-1)!.length > 1) chain.push(String(digitSum(chain.at(-1)!)));
  return chain;
};

// --- Facts quoted by the copy ----------------------------------------------

export const puzzleFacts = (spec: EpisodeSpec): Facts => {
  switch (spec.template) {
    case "fibonacci": {
      const f = fibonacci(spec.fibonacci.terms);
      return { "fib.next": f.at(-1)!, "fib.a": f.at(-3)!, "fib.b": f.at(-2)!, "fib.shown": f.slice(0, -1).join(", ") };
    }
    case "handshakes": {
      const { pairs } = handshakes(spec.table.guests);
      return { guests: spec.table.guests, others: spec.table.guests - 1, pairs: pairs.length, ends: spec.table.guests * (spec.table.guests - 1) };
    }
    case "coins": {
      const { denominations: d, target } = spec.coins;
      const g = greedyCoins(d, target)!;
      const b = fewestCoins(d, target)[target]!;
      return { target, "greedy.coins": g.join(" + "), "greedy.count": g.length, "best.coins": b.join(" + "), "best.count": b.length };
    }
    case "digit-sum": {
      const chain = digitChain(divisibleNumber(spec.number.seed, spec.number.digits));
      return { number: groupThousands(chain[0]), digits: chain[0].length, "sum": chain[1], "sum.digits": [...chain[1]].join(" + "), "sum.sum": chain[2] };
    }
    default:
      return {};
  }
};
