import type { Puzzle, Room } from './game';

export type PostKind = 'daily' | 'community';

export type Result = { moves: number; path: string };

export type Stats = {
  players: number;
  /** moves -> number of players who finished in that many moves */
  histogram: Record<string, number>;
  top: { name: string; moves: number }[];
};

export type Streak = { current: number; best: number; solved: number };

export type InitResponse = {
  postId: string;
  kind: PostKind;
  title: string;
  subtitle: string;
  author: string | null;
  puzzle: Puzzle;
  username: string | null;
  result: Result | null;
  stats: Stats;
  streak: Streak;
  todayPostId: string | null;
};

export type SolveRequest = { path: string };
export type SolveResponse = {
  result: Result;
  stats: Stats;
  streak: Streak;
  first: boolean;
};

export type ShareResponse = { ok: boolean; message: string };

export type RoomRequest = { room: Room; name: string };
export type RoomResponse =
  { ok: true; url: string; par: number } | { ok: false; message: string };

export type ApiError = { status: 'error'; message: string };
