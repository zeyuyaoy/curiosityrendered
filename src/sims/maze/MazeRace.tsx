import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { inter, tabular } from "../../brand/fonts";
import { brand, safeWidth } from "../../brand/tokens";
import { enter, ramp } from "../../components/motion";
import { Sfx } from "../../components/Sfx";
import { useEpisode } from "../../episode/context";
import { runWindow } from "../compute";
import type { AlgoName, Grid, SearchResult } from "./maze";

const { color, layout, safe } = brand;

const RACERS: Record<AlgoName, { name: string; hue: string }> = {
  bfs: { name: "BFS", hue: color.tertiary },
  greedy: { name: "Greedy", hue: color.secondary },
  astar: { name: "A*", hue: color.primary },
};
const ORDER: AlgoName[] = ["bfs", "greedy", "astar"];
const TABLE: AlgoName[] = ["greedy", "bfs", "astar"];
const FLOOR = "#273443";
const TRAIL = 14;
const STRIP = 62;
const PULLBACK = 0.64;

type Route = { path: number[]; hue: string; t: number; faint?: boolean };

export const MazeRace: React.FC<{ grid: Grid; results: Record<AlgoName, SearchResult> }> = ({ grid, results }) => {
  const frame = useCurrentFrame();
  const { timeline, bare } = useEpisode();
  const beat = (id: string) => timeline.beats.find((b) => b.id === id)!;
  const hook = beat("hook");
  const verdict = beat("verdict");
  const runs = Object.fromEntries(ORDER.map((a) => [a, runWindow(beat(a), results[a].expanded)])) as Record<AlgoName, ReturnType<typeof runWindow>>;

  const cell = Math.floor(Math.min(safeWidth / grid.cols, (layout.bodyBottom - layout.bodyTop - STRIP) / grid.rows));
  const W = cell * grid.cols;
  const H = cell * grid.rows;
  const left = safe.left + (safeWidth - W) / 2;
  const optimal = results.bfs.pathLength;

  const active = [...ORDER].reverse().find((a) => frame >= beat(a).from && frame < verdict.from) ?? null;
  const payoff = bare || frame >= verdict.from;
  const routeT = (a: AlgoName) => ramp(frame, runs[a].filled, runs[a].routeDone);
  const routes: Route[] = payoff
    ? [
        { path: results.greedy.path, hue: RACERS.greedy.hue, t: 1 },
        { path: results.astar.path, hue: RACERS.astar.hue, t: 1 },
      ]
    : active === "bfs"
      ? [{ path: results.bfs.path, hue: RACERS.bfs.hue, t: routeT("bfs") }]
      : active
        ? [
            { path: results.bfs.path, hue: RACERS.bfs.hue, t: 1, faint: true },
            { path: results[active].path, hue: RACERS[active].hue, t: routeT(active) },
          ]
        : [];
  const n = active ? Math.max(0, Math.min(results[active].expanded, Math.floor((frame - runs[active].start) * runs[active].rate))) : 0;

  const s0 = grid.start;
  const origin = `${(s0 % grid.cols) * cell + cell / 2}px ${Math.floor(s0 / grid.cols) * cell + cell / 2}px`;
  const zoom = bare ? 1 : 1 + 0.7 * (1 - ramp(frame, 0, hook.duration - 4));
  const pull = bare ? 0 : enter(frame, verdict.from, 20, 120);
  const scale = 1 - (1 - PULLBACK) * pull;
  const top = layout.bodyTop + (bare ? 140 : 0);

  return (
    <AbsoluteFill>
      {bare
        ? null
        : ORDER.map((a) => (
            <React.Fragment key={a}>
              <Sfx name="whoosh" at={runs[a].start} volume={0.2} />
              <Sfx name="scan" at={runs[a].start} frames={runs[a].filled - runs[a].start} volume={0.07} loop />
              <Sfx name="ding" at={runs[a].filled} volume={0.3} />
            </React.Fragment>
          ))}
      {bare ? null : <Sfx name="reveal" at={verdict.from} volume={0.3} />}
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: W,
          height: H,
          overflow: "hidden",
          borderRadius: brand.radius.sm,
          boxShadow: `0 0 0 2px ${color.muted}`,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: origin }}>
          <MazeView
            grid={grid}
            cell={cell}
            fill={active ? { res: results[active], n, hue: RACERS[active].hue } : null}
            routes={routes}
            labels={bare ? 0 : 1 - ramp(frame, beat("bfs").from + 20, beat("bfs").from + 34)}
            exitLabel={bare ? 0 : ramp(frame, hook.duration - 30, hook.duration - 14)}
          />
        </div>
      </div>
      {active && !bare ? <Strip algo={active} n={n} res={results[active]} optimal={optimal} routeT={routeT(active)} top={top + H + 12} /> : null}
      {payoff && !bare ? <Table results={results} optimal={optimal} top={top + H * PULLBACK + 16} verdict={verdict} /> : null}
    </AbsoluteFill>
  );
};

const Strip: React.FC<{ algo: AlgoName; n: number; res: SearchResult; optimal: number; routeT: number; top: number }> = ({ algo, n, res, optimal, routeT, top }) => {
  const { name, hue } = RACERS[algo];
  const extra = res.pathLength - optimal;
  return (
    <div style={{ position: "absolute", left: safe.left, width: safeWidth, top, height: STRIP - 12, display: "flex", alignItems: "center", gap: 16, fontFamily: inter, ...tabular }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, background: hue, flexShrink: 0 }} />
      <span style={{ fontWeight: 800, fontSize: 42, color: color.fg }}>{name}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontWeight: 600, fontSize: 32, color: color.fgDim }}>checked</span>
      <span style={{ fontWeight: 800, fontSize: 42, color: hue, minWidth: 74, textAlign: "right" }}>{n}</span>
      <span style={{ opacity: routeT, display: "flex", alignItems: "baseline", gap: 12, marginLeft: 18 }}>
        <span style={{ fontWeight: 600, fontSize: 32, color: color.fgDim }}>route</span>
        <span style={{ fontWeight: 800, fontSize: 42, color: color.fg }}>{res.pathLength}</span>
        <span style={{ fontWeight: 800, fontSize: 32, color: extra > 0 ? color.secondary : color.fgDim }}>{extra > 0 ? `+${extra}` : "shortest"}</span>
      </span>
    </div>
  );
};

const Table: React.FC<{ results: Record<AlgoName, SearchResult>; optimal: number; top: number; verdict: { from: number; duration: number } }> = ({
  results,
  optimal,
  top,
  verdict,
}) => {
  const frame = useCurrentFrame();
  const heroAt = verdict.from + Math.round(verdict.duration * 0.45);
  const col = { fontFamily: inter, ...tabular } as const;
  return (
    <div style={{ position: "absolute", left: safe.left, width: safeWidth, top }}>
      <div style={{ ...col, display: "flex", fontWeight: 600, fontSize: 30, color: color.fgDim, padding: "0 24px 6px", opacity: ramp(frame, verdict.from + 8, verdict.from + 18) }}>
        <span style={{ flex: 1 }} />
        <span style={{ width: 250, textAlign: "right" }}>squares checked</span>
        <span style={{ width: 270, textAlign: "right" }}>route</span>
      </div>
      {TABLE.map((a, i) => {
        const r = results[a];
        const { name, hue } = RACERS[a];
        const p = enter(frame, verdict.from + 10 + i * 5, 16, 170);
        const extra = r.pathLength - optimal;
        const lit = a === "greedy" ? frame < heroAt : a === "astar" && frame >= heroAt;
        return (
          <div
            key={a}
            style={{
              ...col,
              display: "flex",
              alignItems: "center",
              height: 80,
              marginTop: 6,
              padding: "0 24px",
              borderRadius: brand.radius.md,
              background: lit ? color.surface : "transparent",
              boxShadow: lit ? `inset 0 0 0 3px ${hue}` : undefined,
              opacity: Math.min(1, p * 1.4),
              transform: `translateY(${(1 - p) * 24}px)`,
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: 5, background: hue, marginRight: 16, flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 800, fontSize: 46, color: color.fg }}>{name}</span>
            <span style={{ width: 250, textAlign: "right", fontWeight: 800, fontSize: 50, color: hue }}>{r.expanded}</span>
            <span style={{ width: 270, textAlign: "right", fontWeight: 800, fontSize: 50, color: color.fg }}>
              {r.pathLength}
              <span style={{ fontSize: 34, marginLeft: 12, color: extra > 0 ? color.secondary : color.fgDim }}>{extra > 0 ? `+${extra}` : "✓"}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

type Fill = { res: SearchResult; n: number; hue: string } | null;

const MazeView: React.FC<{ grid: Grid; cell: number; fill: Fill; routes: Route[]; labels: number; exitLabel: number }> = ({
  grid,
  cell,
  fill,
  routes,
  labels,
  exitLabel,
}) => {
  const { cols, rows } = grid;
  const walls = useMemo(() => grid.open.flatMap((o, c) => (o ? [] : [c])), [grid]);
  const at = (c: number) => [(c % cols) * cell, Math.floor(c / cols) * cell] as const;
  const centre = (c: number) => at(c).map((v) => v + cell / 2).join(",");
  const [sx, sy] = at(grid.start);
  const [gx, gy] = at(grid.goal);

  return (
    <svg width={cols * cell} height={rows * cell} style={{ display: "block", background: FLOOR }}>
      {fill
        ? fill.res.order.slice(0, fill.n).map((c, k) => {
            const age = fill.n - 1 - k;
            const [x, y] = at(c);
            return <rect key={c} x={x} y={y} width={cell} height={cell} fill={fill.hue} opacity={0.45 + 0.5 * Math.max(0, 1 - age / TRAIL)} />;
          })
        : null}
      {walls.map((c) => {
        const [x, y] = at(c);
        return <rect key={c} x={x} y={y} width={cell} height={cell} fill={color.bg} shapeRendering="crispEdges" />;
      })}
      {routes.map((r, i) => {
        if (r.t <= 0) return null;
        const len = Math.max(1, r.path.length - 1) * cell;
        const pts = r.path.map(centre).join(" ");
        const w = cell * (r.faint ? 0.18 : 0.42);
        const dash = { strokeDasharray: len, strokeDashoffset: len * (1 - r.t), strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
        return (
          <g key={i} opacity={r.faint ? 0.55 : 1}>
            {r.faint ? null : <polyline points={pts} stroke={color.bg} strokeWidth={w + 8} {...dash} />}
            <polyline points={pts} stroke={r.hue} strokeWidth={w} {...dash} />
          </g>
        );
      })}
      <circle cx={sx + cell / 2} cy={sy + cell / 2} r={cell * 0.4} fill={color.fg} stroke={color.bg} strokeWidth={4} />
      <rect x={gx + cell * 0.1} y={gy + cell * 0.1} width={cell * 0.8} height={cell * 0.8} rx={6} fill={color.fg} stroke={color.bg} strokeWidth={4} />
      <g fontFamily={inter} fontWeight={800} fontSize={30} fill={color.fg} stroke={color.bg} strokeWidth={8} paintOrder="stroke">
        <text x={sx + cell * 1.1} y={sy - cell * 0.25} opacity={labels}>
          start
        </text>
        <text x={gx - cell * 0.1} y={gy - cell * 0.25} textAnchor="end" opacity={Math.min(labels, exitLabel)}>
          exit
        </text>
      </g>
    </svg>
  );
};
