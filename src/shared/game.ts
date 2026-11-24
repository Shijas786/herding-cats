export type Dir = 'U' | 'D' | 'L' | 'R';

export type Room = {
  w: number;
  h: number;
  walls: number[];
  cats: number[];
  cushions: number[];
};

export type Puzzle = Room & { par: number };

export const DIRS: readonly Dir[] = ['U', 'D', 'L', 'R'];

const DELTA: Record<Dir, readonly [number, number]> = {
  U: [0, -1],
  D: [0, 1],
  L: [-1, 0],
  R: [1, 0],
};

export const MAX_SIZE = 8;
export const MIN_SIZE = 4;
export const MAX_CATS = 4;

/** Slides every cat until it hits a wall, the edge or another cat. Keeps cat order. */
export const tilt = (
  room: Room,
  cats: readonly number[],
  dir: Dir
): number[] => {
  const [dx, dy] = DELTA[dir];
  const { w, h } = room;
  const blocked = new Set<number>(room.walls);
  const order = cats
    .map((pos, i) => ({ pos, i }))
    .sort((a, b) => {
      const ka = (a.pos % w) * dx + Math.floor(a.pos / w) * dy;
      const kb = (b.pos % w) * dx + Math.floor(b.pos / w) * dy;
      return kb - ka;
    });
  const out = [...cats];
  for (const { pos, i } of order) {
    let x = pos % w;
    let y = Math.floor(pos / w);
    for (;;) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) break;
      if (blocked.has(ny * w + nx)) break;
      x = nx;
      y = ny;
    }
    out[i] = y * w + x;
    blocked.add(y * w + x);
  }
  return out;
};

export const isSolved = (room: Room, cats: readonly number[]): boolean => {
  const set = new Set(cats);
  return room.cushions.length > 0 && room.cushions.every((c) => set.has(c));
};

const keyOf = (cats: readonly number[]): string =>
  [...cats].sort((a, b) => a - b).join(',');

type Explored = {
  depth: Map<string, number>;
  parent: Map<string, { prev: string; dir: Dir }>;
};

const MAX_STATES = 60000;

const explore = (
  room: Room,
  stopAt?: (cats: number[]) => boolean
): Explored & { hit: string | null } => {
  const depth = new Map<string, number>();
  const parent = new Map<string, { prev: string; dir: Dir }>();
  const start = [...room.cats].sort((a, b) => a - b);
  const startKey = keyOf(start);
  depth.set(startKey, 0);
  if (stopAt?.(start)) return { depth, parent, hit: startKey };
  let frontier: number[][] = [start];
  let d = 0;
  while (frontier.length > 0 && depth.size < MAX_STATES) {
    d += 1;
    const next: number[][] = [];
    for (const cats of frontier) {
      const prev = keyOf(cats);
      for (const dir of DIRS) {
        const moved = tilt(room, cats, dir).sort((a, b) => a - b);
        const k = keyOf(moved);
        if (depth.has(k)) continue;
        depth.set(k, d);
        parent.set(k, { prev, dir });
        if (stopAt?.(moved)) return { depth, parent, hit: k };
        next.push(moved);
      }
    }
    frontier = next;
  }
  return { depth, parent, hit: null };
};

/** Shortest solution, or null when the room cannot be solved. */
export const solve = (room: Room): Dir[] | null => {
  const res = explore(room, (cats) => isSolved(room, cats));
  if (res.hit === null) return null;
  const path: Dir[] = [];
  let k = res.hit;
  for (;;) {
    const p = res.parent.get(k);
    if (!p) break;
    path.push(p.dir);
    k = p.prev;
  }
  return path.reverse();
};

export const validateRoom = (room: Room): string | null => {
  const { w, h } = room;
  if (!Number.isInteger(w) || w !== h) return 'Bad room size';
  if (w < MIN_SIZE || h < MIN_SIZE || w > MAX_SIZE || h > MAX_SIZE)
    return 'Bad room size';
  const all = [...room.walls, ...room.cats, ...room.cushions];
  if (!all.every((c) => Number.isInteger(c) && c >= 0 && c < w * h))
    return 'Something is outside the room';
  if (room.cats.length < 1 || room.cats.length > MAX_CATS)
    return `Place 1 to ${MAX_CATS} cats`;
  if (room.cushions.length !== room.cats.length)
    return 'Every cat needs exactly one cushion';
  if (new Set(room.cats).size !== room.cats.length)
    return 'Two cats share a tile';
  if (new Set(room.cushions).size !== room.cushions.length)
    return 'Two cushions share a tile';
  const walls = new Set(room.walls);
  if ([...room.cats, ...room.cushions].some((c) => walls.has(c)))
    return 'Furniture is in the way';
  if (isSolved(room, room.cats)) return 'The cats are already napping';
  return null;
};

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export type Tier = { size: number; cats: number; par: number; label: string };

/** Monday (index 0) is a warm-up, Sunday is the boss room. */
export const TIERS: readonly Tier[] = [
  { size: 5, cats: 2, par: 4, label: 'Catnap' },
  { size: 5, cats: 2, par: 5, label: 'Easy' },
  { size: 6, cats: 3, par: 6, label: 'Medium' },
  { size: 6, cats: 3, par: 7, label: 'Tricky' },
  { size: 6, cats: 3, par: 8, label: 'Hard' },
  { size: 7, cats: 3, par: 9, label: 'Fiendish' },
  { size: 7, cats: 4, par: 11, label: 'Chaos' },
];

const DAY_MS = 86400000;
const EPOCH = Date.UTC(2026, 10, 23);

export const dateKey = (now: number): string =>
  new Date(now).toISOString().slice(0, 10);
export const dayNumber = (key: string): number =>
  Math.round((Date.parse(`${key}T00:00:00Z`) - EPOCH) / DAY_MS) + 1;
/** 0 = Monday ... 6 = Sunday */
export const weekdayIndex = (key: string): number =>
  (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7;
export const tierFor = (key: string): Tier =>
  TIERS[weekdayIndex(key)] ?? TIERS[0]!;
export const shiftDate = (key: string, days: number): string =>
  dateKey(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS);

const pick = <T>(rng: () => number, arr: readonly T[]): T | undefined =>
  arr[Math.floor(rng() * arr.length)];

const parse = (k: string): number[] => k.split(',').map(Number);

export const generate = (seedText: string, tier: Tier): Puzzle => {
  const rng = mulberry32(hash(seedText));
  const { size } = tier;
  const cells = size * size;
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const order = Array.from({ length: cells }, (_, i) => i);
    for (let i = cells - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const a = order[i] ?? 0;
      order[i] = order[j] ?? 0;
      order[j] = a;
    }
    const wallCount = Math.round(cells * (0.1 + rng() * 0.08));
    const walls = order.slice(0, wallCount);
    const cats = order.slice(wallCount, wallCount + tier.cats);
    const room: Room = { w: size, h: size, walls, cats, cushions: [] };
    const { depth } = explore(room);
    const startSet = new Set(cats);
    const atPar: string[] = [];
    let deepest = { k: '', d: 0 };
    for (const [k, d] of depth) {
      const pos = parse(k);
      if (pos.some((p) => startSet.has(p))) continue;
      if (d === tier.par) atPar.push(k);
      if (d > deepest.d && d <= tier.par) deepest = { k, d };
    }
    const chosen = pick(rng, atPar);
    if (chosen !== undefined) {
      return { ...room, cushions: parse(chosen), par: tier.par };
    }
    if (deepest.d > (best?.par ?? 0)) {
      best = { ...room, cushions: parse(deepest.k), par: deepest.d };
    }
  }
  if (best) return best;
  throw new Error('Could not generate a room');
};

export const dailyPuzzle = (key: string): Puzzle =>
  generate(`herding-cats:${key}`, tierFor(key));

export const starsFor = (moves: number, par: number): number =>
  moves <= par ? 3 : moves <= par + 3 ? 2 : 1;

const ARROW: Record<Dir, string> = { U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️' };

/** Spoiler-free share text: stars and move count only. */
export const shareText = (title: string, moves: number, par: number): string =>
  `${title}: herded in ${moves} move${moves === 1 ? '' : 's'} (par ${par}) ${'⭐'.repeat(starsFor(moves, par))}`;

export const pathEmoji = (path: readonly Dir[]): string =>
  path.map((d) => ARROW[d]).join('');

export const parsePath = (s: string): Dir[] | null => {
  const out: Dir[] = [];
  for (const ch of s) {
    if (ch === 'U' || ch === 'D' || ch === 'L' || ch === 'R') out.push(ch);
    else return null;
  }
  return out;
};

/** Replays a path; returns true when it ends with every cushion occupied. */
export const verify = (room: Room, path: readonly Dir[]): boolean => {
  let cats = [...room.cats];
  for (const d of path) cats = tilt(room, cats, d);
  return isSolved(room, cats);
};
