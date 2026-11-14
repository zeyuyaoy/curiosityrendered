import type { z } from "zod";
import type { MazeSim } from "../episode/schema";
import { generateMaze, runAll } from "./maze/maze";

export type Facts = Record<string, string | number>;

const SHARES: [number, string][] = [
  [0.1, "about a tenth of"], [0.25, "about a quarter of"], [1 / 3, "about a third of"], [0.5, "about half"],
  [2 / 3, "about two thirds of"], [0.75, "about three quarters of"], [0.92, "nearly all"],
];
export const share = (part: number, whole: number) =>
  part >= whole ? "all" : SHARES.reduce((a, b) => (Math.abs(b[0] - part / whole) < Math.abs(a[0] - part / whole) ? b : a))[1];

export const computeMaze = (o: z.output<typeof MazeSim>) => {
  const grid = generateMaze(o);
  const results = runAll(grid);
  const { bfs, greedy, astar } = results;
  const optimal = bfs.pathLength;
  const facts: Facts = {
    "cells": grid.open.filter(Boolean).length,
    "optimal": optimal,
    "greedy.extra": greedy.pathLength - optimal,
    "astar.saved": bfs.expanded - astar.expanded,
    "astar.savedPct": Math.round((100 * (bfs.expanded - astar.expanded)) / bfs.expanded),
    "astar.searchShare": share(astar.expanded, bfs.expanded),
  };
  for (const r of [bfs, greedy, astar]) {
    facts[`${r.algo}.expanded`] = r.expanded;
    facts[`${r.algo}.path`] = r.pathLength;
  }
  return { grid, results, facts };
};

export const RUN = { lead: 6, fill: 75, route: 18 } as const;
export const runWindow = (beat: { from: number }, expanded: number) => {
  const start = beat.from + RUN.lead;
  const filled = start + RUN.fill;
  return { start, filled, routeDone: filled + RUN.route, rate: expanded / RUN.fill };
};

export const simBeats = { maze: ["bfs", "greedy", "astar", "verdict"] } as const;
