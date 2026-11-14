
export type Grid = {
  cols: number;
  rows: number;
  open: boolean[];
  start: number;
  goal: number;
};
export type MazeOptions = {
  cellsX: number;
  cellsY: number;
  seed: number;
  loops: number;
};
export type AlgoName = 'bfs' | 'greedy' | 'astar';
export type SearchResult = {
  algo: AlgoName;
  order: number[];
  path: number[];
  expanded: number;
  pathLength: number;
};

export const SHOWCASE: MazeOptions = { cellsX: 23, cellsY: 5, seed: 772, loops: 0.14 };

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateMaze(o: MazeOptions): Grid {
  const { cellsX, cellsY } = o;
  const cols = 2 * cellsX + 1;
  const rows = 2 * cellsY + 1;
  const rnd = mulberry32(o.seed);
  const open: boolean[] = new Array<boolean>(cols * rows).fill(false);
  const visited: boolean[] = new Array<boolean>(cellsX * cellsY).fill(false);
  const idx = (cx: number, cy: number) => (2 * cy + 1) * cols + 2 * cx + 1;

  const stack: [number, number][] = [[0, 0]];
  visited[0] = true;
  open[idx(0, 0)] = true;
  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1]!;
    const next: [number, number][] = [];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < cellsX && ny < cellsY && !visited[ny * cellsX + nx]) next.push([nx, ny]);
    }
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const [nx, ny] = next[Math.floor(rnd() * next.length)]!;
    visited[ny * cellsX + nx] = true;
    open[idx(nx, ny)] = true;
    open[(cy + ny + 1) * cols + (cx + nx + 1)] = true;
    stack.push([nx, ny]);
  }

  const cand: number[] = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const i = y * cols + x;
      if (open[i]) continue;
      if ((open[i - 1] && open[i + 1]) || (open[i - cols] && open[i + cols])) cand.push(i);
    }
  }
  for (let i = cand.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [cand[i], cand[j]] = [cand[j]!, cand[i]!];
  }
  const knock = Math.round(Math.min(1, Math.max(0, o.loops)) * cand.length);
  for (let k = 0; k < knock; k++) open[cand[k]!] = true;

  const y = 2 * Math.floor(cellsY / 2) + 1;
  return { cols, rows, open, start: y * cols + 1, goal: y * cols + cols - 2 };
}

const DIRS: readonly [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function neighbours(g: Grid, i: number): number[] {
  const x = i % g.cols;
  const y = (i - x) / g.cols;
  const out: number[] = [];
  for (const [dx, dy] of DIRS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < g.cols && ny < g.rows && g.open[ny * g.cols + nx]) out.push(ny * g.cols + nx);
  }
  return out;
}

function manhattan(g: Grid, a: number, b: number): number {
  return Math.abs((a % g.cols) - (b % g.cols)) + Math.abs(Math.floor(a / g.cols) - Math.floor(b / g.cols));
}

function result(algo: AlgoName, g: Grid, order: number[], parent: Int32Array): SearchResult {
  const found = order[order.length - 1] === g.goal;
  const path: number[] = [];
  if (found) for (let n = g.goal; n !== -1; n = parent[n]!) path.push(n);
  path.reverse();
  return { algo, order, path, expanded: order.length, pathLength: found ? path.length - 1 : -1 };
}

export function bfs(g: Grid): SearchResult {
  const parent = new Int32Array(g.open.length).fill(-1);
  const seen = new Uint8Array(g.open.length);
  const queue = [g.start];
  const order: number[] = [];
  seen[g.start] = 1;
  for (let head = 0; head < queue.length; head++) {
    const n = queue[head]!;
    order.push(n);
    if (n === g.goal) break;
    for (const m of neighbours(g, n)) {
      if (seen[m]) continue;
      seen[m] = 1;
      parent[m] = n;
      queue.push(m);
    }
  }
  return result('bfs', g, order, parent);
}

type Entry = [number, number, number, number, number];
const less = (a: Entry, b: Entry) => a[0] !== b[0] ? a[0] < b[0] : a[1] !== b[1] ? a[1] < b[1] : a[2] < b[2];

function push(h: Entry[], e: Entry): void {
  let i = h.push(e) - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (!less(h[i]!, h[p]!)) break;
    [h[i], h[p]] = [h[p]!, h[i]!];
    i = p;
  }
}

function pop(h: Entry[]): Entry {
  const top = h[0]!;
  const last = h.pop()!;
  if (h.length > 0) {
    h[0] = last;
    for (let i = 0; ; ) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && less(h[l]!, h[m]!)) m = l;
      if (r < h.length && less(h[r]!, h[m]!)) m = r;
      if (m === i) break;
      [h[i], h[m]] = [h[m]!, h[i]!];
      i = m;
    }
  }
  return top;
}

function bestFirst(g: Grid, algo: 'greedy' | 'astar'): SearchResult {
  const parent = new Int32Array(g.open.length).fill(-1);
  const best = new Float64Array(g.open.length).fill(Infinity);
  const closed = new Uint8Array(g.open.length);
  const order: number[] = [];
  const heap: Entry[] = [];
  let seq = 0;
  const key = (n: number, gn: number): Entry => {
    const h = manhattan(g, n, g.goal);
    return algo === 'astar' ? [gn + h, h, seq++, n, gn] : [h, 0, seq++, n, gn];
  };
  best[g.start] = 0;
  push(heap, key(g.start, 0));
  while (heap.length > 0) {
    const [, , , n, gn] = pop(heap);
    if (closed[n]) continue;
    closed[n] = 1;
    order.push(n);
    if (n === g.goal) break;
    for (const m of neighbours(g, n)) {
      if (closed[m]) continue;
      if (algo === 'greedy' ? best[m] !== Infinity : gn + 1 >= best[m]!) continue;
      best[m] = gn + 1;
      parent[m] = n;
      push(heap, key(m, gn + 1));
    }
  }
  return result(algo, g, order, parent);
}

export const greedy = (g: Grid): SearchResult => bestFirst(g, 'greedy');
export const astar = (g: Grid): SearchResult => bestFirst(g, 'astar');

export function runAll(g: Grid): Record<AlgoName, SearchResult> {
  return { bfs: bfs(g), greedy: greedy(g), astar: astar(g) };
}
