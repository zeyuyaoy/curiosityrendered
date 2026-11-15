import { describe, expect, it } from "vitest";
import { episodes } from "../episodes";
import { resolveEpisode } from "../episode/resolve";
import { EpisodeSpec } from "../episode/schema";
import {
  allWays, digitChain, digitSum, divisibleNumber, fewestCoins, fibonacci, fibonacciTiles, greedyCoins, groupThousands, handshakes,
} from "./puzzles";

const spec = (id: string) => EpisodeSpec.parse(episodes.find((e) => (e as { id: string }).id === id));
const facts = (id: string) => resolveEpisode(spec(id)).facts;

describe("Fibonacci Day", () => {
  it("11/23 reads as the first four Fibonacci numbers, and the puzzle answer is 8 + 13 = 21", () => {
    expect(fibonacci(8)).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);
    expect([..."1123"].map(Number)).toEqual(fibonacci(4));
    expect(facts("fibonacci-day")).toMatchObject({ "fib.a": 8, "fib.b": 13, "fib.next": 21 });
  });
  it("the squares tile a 21 x 34 rectangle without overlap, and the spiral arcs join end to end", () => {
    const { tiles, box } = fibonacciTiles(8);
    expect([box.w, box.h].sort((a, b) => a - b)).toEqual([21, 34]);
    expect(tiles.reduce((a, t) => a + t.s * t.s, 0)).toBe(box.w * box.h);
    for (const [i, a] of tiles.entries())
      for (const b of tiles.slice(i + 1))
        expect(a.x + a.s <= b.x || b.x + b.s <= a.x || a.y + a.s <= b.y || b.y + b.s <= a.y).toBe(true);
    for (const [i, t] of tiles.entries()) {
      for (const p of [t.arc.from, t.arc.to]) expect(Math.hypot(p[0] - t.arc.cx, p[1] - t.arc.cy)).toBeCloseTo(t.s);
      if (i) expect(t.arc.from).toEqual(tiles[i - 1].arc.to);
    }
  });
});

describe("Thanksgiving greetings", () => {
  it("8 guests make 28 distinct pairs: 7 + 6 + ... + 1 = 8 x 7 / 2", () => {
    const { pairs, running, groups } = handshakes(8);
    const unordered = new Set<string>();
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) if (a !== b) unordered.add([a, b].sort().join("-"));
    expect(pairs.length).toBe(28);
    expect(unordered.size).toBe(28);
    expect(new Set(pairs.map((p) => p.join("-")))).toEqual(unordered);
    expect(groups.map((g) => g.length)).toEqual([7, 6, 5, 4, 3, 2, 1]);
    expect(running).toEqual([7, 13, 18, 22, 25, 27, 28]);
    expect(facts("thanksgiving-greetings")).toMatchObject({ guests: 8, others: 7, ends: 56, pairs: 28 });
  });
});

describe("greedy coin trap", () => {
  it("biggest-first pays 6 as 4 + 1 + 1; the fewest is 3 + 3, confirmed by exhaustive search", () => {
    expect(greedyCoins([1, 3, 4], 6)).toEqual([4, 1, 1]);
    expect(fewestCoins([1, 3, 4], 6)[6]).toEqual([3, 3]);
    const ways = allWays([1, 3, 4], 6);
    const min = Math.min(...ways.map((w) => w.length));
    expect(min).toBe(2);
    expect(ways.filter((w) => w.length === min)).toEqual([[3, 3]]);
    for (const w of ways) expect(w.reduce((a, c) => a + c, 0)).toBe(6);
    expect(facts("greedy-coin-trap")).toMatchObject({ "greedy.coins": "4 + 1 + 1", "greedy.count": 3, "best.coins": "3 + 3", "best.count": 2 });
  });
  it("DP and exhaustive search agree on every amount the verify table shows, and 6 is the first greedy miss", () => {
    const dp = fewestCoins([1, 3, 4], 6);
    for (let a = 1; a <= 6; a++) {
      expect(dp[a]!.length).toBe(Math.min(...allWays([1, 3, 4], a).map((w) => w.length)));
      expect(greedyCoins([1, 3, 4], a)!.length > dp[a]!.length).toBe(a === 6);
    }
  });
  it("the caption's contrast holds: greedy is optimal for 1, 5, 10, 25 on every amount up to 500", () => {
    const us = [1, 5, 10, 25];
    const dp = fewestCoins(us, 500);
    for (let a = 1; a <= 500; a++) expect(greedyCoins(us, a)!.length).toBe(dp[a]!.length);
  });
});

describe("divisibility by 9", () => {
  const { number } = spec("divisible-by-nine") as Extract<EpisodeSpec, { template: "digit-sum" }>;
  const n = divisibleNumber(number.seed, number.digits);
  it("is deterministic, has the requested length, and is divisible by 9 by direct BigInt division", () => {
    expect(divisibleNumber(number.seed, number.digits)).toBe(n);
    expect(n).toHaveLength(number.digits);
    expect(n[0]).not.toBe("0");
    expect(BigInt(n) % 9n).toBe(0n);
    expect((BigInt(n) / 9n) * 9n).toBe(BigInt(n));
  });
  it("collapses to 9 in two digit sums, and the copy quotes those sums", () => {
    const chain = digitChain(n);
    expect(chain).toHaveLength(3);
    expect(chain[2]).toBe("9");
    expect(Number(chain[1]) % 9).toBe(0);
    expect(facts("divisible-by-nine")).toMatchObject({ sum: chain[1], "sum.sum": "9", number: groupThousands(n) });
  });
  it("the rule itself: any number and its digit sum leave the same remainder by 9", () => {
    for (let k = 0; k < 2000; k++) {
      const m = String(BigInt(k) * 7919n + 104729n);
      expect(BigInt(m) % 9n).toBe(BigInt(digitSum(m)) % 9n);
    }
  });
});
