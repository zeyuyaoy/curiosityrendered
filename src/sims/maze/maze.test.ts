import { describe, it, expect } from 'vitest';
import { SHOWCASE, astar, bfs, generateMaze, greedy, runAll, type Grid, type MazeOptions, type SearchResult } from './maze';

function refDist(g: Grid): number[] {
  const d: number[] = g.open.map(() => Infinity);
  d[g.start] = 0;
  for (let changed = true; changed; ) {
    changed = false;
    for (let i = 0; i < d.length; i++) {
      if (!g.open[i]) continue;
      const x = i % g.cols;
      const nb = [x > 0 ? i - 1 : -1, x < g.cols - 1 ? i + 1 : -1, i - g.cols, i + g.cols];
      for (const j of nb) {
        if (j >= 0 && j < d.length && g.open[j] && d[j]! + 1 < d[i]!) {
          d[i] = d[j]! + 1;
          changed = true;
        }
      }
    }
  }
  return d;
}

function expectValidPath(g: Grid, r: SearchResult) {
  const p = r.path;
  expect(p[0]).toBe(g.start);
  expect(p[p.length - 1]).toBe(g.goal);
  expect(r.pathLength).toBe(p.length - 1);
  expect(new Set(p).size).toBe(p.length);
  for (const c of p) expect(g.open[c]).toBe(true);
  for (let k = 1; k < p.length; k++) {
    const a = p[k - 1]!;
    const b = p[k]!;
    const dx = Math.abs((a % g.cols) - (b % g.cols));
    const dy = Math.abs(Math.floor(a / g.cols) - Math.floor(b / g.cols));
    expect(dx + dy).toBe(1);
  }
}

function expectValidOrder(g: Grid, r: SearchResult) {
  expect(r.order[0]).toBe(g.start);
  expect(r.order[r.order.length - 1]).toBe(g.goal);
  expect(new Set(r.order).size).toBe(r.order.length);
  expect(r.expanded).toBe(r.order.length);
}

const cases: MazeOptions[] = [];
for (let s = 0; s < 200; s++) {
  cases.push({ cellsX: 2 + (s % 19), cellsY: 1 + ((s * 7) % 10), seed: 1000 + s, loops: [0, 0.05, 0.1, 0.2, 0.5, 1][s % 6]! });
}

describe('maze search', () => {
  it('produces valid, optimal (BFS, A*) and valid, non-optimal-bounded (greedy) results on 200 mazes', () => {
    for (const o of cases) {
      const g = generateMaze(o);
      expect(g.cols).toBe(2 * o.cellsX + 1);
      expect(g.rows).toBe(2 * o.cellsY + 1);
      expect(g.open.length).toBe(g.cols * g.rows);
      const d = refDist(g);
      const opt = d[g.goal]!;
      const r = runAll(g);
      for (const res of Object.values(r)) {
        expectValidPath(g, res);
        expectValidOrder(g, res);
      }
      expect(r.bfs.pathLength).toBe(opt);
      expect(r.astar.pathLength).toBe(opt);
      expect(r.greedy.pathLength).toBeGreaterThanOrEqual(opt);
      for (let k = 1; k < r.bfs.order.length; k++) expect(d[r.bfs.order[k]!]!).toBeGreaterThanOrEqual(d[r.bfs.order[k - 1]!]!);
    }
  });

  it('is deterministic', () => {
    for (const o of [SHOWCASE, cases[17]!, cases[123]!]) {
      const a = generateMaze(o);
      const b = generateMaze({ ...o });
      expect(b).toEqual(a);
      expect(runAll(b)).toEqual(runAll(a));
      expect({ bfs: bfs(a), greedy: greedy(a), astar: astar(a) }).toEqual(runAll(a));
    }
  });

  it('SHOWCASE has the properties the video relies on', () => {
    expect(SHOWCASE.cellsX).toBe(23);
    expect(SHOWCASE.cellsY).toBe(5);
    const g = generateMaze(SHOWCASE);
    const { bfs: b, greedy: gr, astar: a } = runAll(g);
    const openCells = g.open.filter(Boolean).length;
    expect(a.pathLength).toBe(b.pathLength);
    expect(b.pathLength).toBe(refDist(g)[g.goal]);
    expect(gr.pathLength - b.pathLength).toBeGreaterThanOrEqual(6);
    expect(gr.expanded).toBeLessThan(a.expanded);
    expect(a.expanded).toBeLessThan(b.expanded);
    expect(a.expanded).toBeLessThanOrEqual(0.6 * b.expanded);
    expect(b.expanded).toBeGreaterThanOrEqual(0.85 * openCells);
  });
});
