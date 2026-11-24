import { context, reddit, redis } from '@devvit/web/server';
import type { PostKind } from '../../shared/api';
import {
  type Puzzle,
  dailyPuzzle,
  dateKey,
  dayNumber,
  shiftDate,
  tierFor,
  weekdayIndex,
} from '../../shared/game';

export type PostRecord = {
  kind: PostKind;
  title: string;
  subtitle: string;
  author: string | null;
  date: string;
  puzzle: Puzzle;
};

export const keys = {
  post: (postId: string) => `post:${postId}`,
  daily: (date: string) => `daily:${date}`,
  results: (postId: string) => `results:${postId}`,
  paths: (postId: string) => `paths:${postId}`,
  histogram: (postId: string) => `histogram:${postId}`,
  user: (name: string) => `user:${name}`,
  week: (monday: string) => `week:${monday}`,
};

/** Reddit comment links take the bare post id, not the t3_ fullname. */
export const postUrl = (postId: string): string =>
  `https://reddit.com/r/${context.subredditName}/comments/${postId.replace(/^t3_/, '')}`;

export const mondayOf = (date: string): string =>
  shiftDate(date, -weekdayIndex(date));

const isPuzzle = (v: unknown): v is Puzzle =>
  typeof v === 'object' &&
  v !== null &&
  'w' in v &&
  'cats' in v &&
  'cushions' in v &&
  'par' in v;

export const savePost = async (
  postId: string,
  rec: PostRecord
): Promise<void> => {
  await redis.hSet(keys.post(postId), {
    kind: rec.kind,
    title: rec.title,
    subtitle: rec.subtitle,
    author: rec.author ?? '',
    date: rec.date,
    puzzle: JSON.stringify(rec.puzzle),
  });
};

export const loadPost = async (postId: string): Promise<PostRecord | null> => {
  const h = await redis.hGetAll(keys.post(postId));
  if (!h.puzzle) return null;
  const puzzle: unknown = JSON.parse(h.puzzle);
  if (!isPuzzle(puzzle)) return null;
  return {
    kind: h.kind === 'community' ? 'community' : 'daily',
    title: h.title ?? 'Herding Cats',
    subtitle: h.subtitle ?? '',
    author: h.author ? h.author : null,
    date: h.date ?? dateKey(Date.now()),
    puzzle,
  };
};

/** On Sundays the most upvoted community room of the week becomes the daily. */
const communityPick = async (date: string): Promise<PostRecord | null> => {
  if (weekdayIndex(date) !== 6) return null;
  const entries = await redis.zRange(keys.week(mondayOf(date)), 0, -1);
  let best: { rec: PostRecord; score: number } | null = null;
  for (const { member } of entries.slice(-40)) {
    try {
      const rec = await loadPost(member);
      if (!rec) continue;
      const post = await reddit.getPostById(
        member.startsWith('t3_') ? `t3_${member.slice(3)}` : `t3_${member}`
      );
      if (post.isRemoved()) continue;
      if (!best || post.score > best.score) best = { rec, score: post.score };
    } catch (error) {
      console.error(`Skipping community room ${member}: ${error}`);
    }
  }
  return best ? best.rec : null;
};

export const ensureDailyPost = async (): Promise<{
  postId: string;
  created: boolean;
}> => {
  const date = dateKey(Date.now());
  const existing = await redis.get(keys.daily(date));
  if (existing) return { postId: existing, created: false };

  const n = dayNumber(date);
  const tier = tierFor(date);
  const picked = await communityPick(date);
  const rec: PostRecord = picked
    ? {
        kind: 'daily',
        title: `Herding Cats #${n}: Community Sunday`,
        subtitle: `"${picked.title}" by u/${picked.author ?? 'a redditor'}, voted in by you`,
        author: picked.author,
        date,
        puzzle: picked.puzzle,
      }
    : {
        kind: 'daily',
        title: `Herding Cats #${n}: ${tier.label}`,
        subtitle: `${tier.label} room, par ${tier.par}`,
        author: null,
        date,
        puzzle: dailyPuzzle(date),
      };

  const post = await reddit.submitCustomPost({
    title: rec.title,
    subredditName: context.subredditName,
    entry: 'default',
    textFallback: {
      text: `${rec.title}. Tilt the room so every cat slides onto a cushion. Par is ${rec.puzzle.par} moves.`,
    },
  });
  await savePost(post.id, rec);
  await redis.set(keys.daily(date), post.id);
  return { postId: post.id, created: true };
};
