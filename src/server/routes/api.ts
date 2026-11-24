import { Hono } from 'hono';
import { context, reddit, redis } from '@devvit/web/server';
import type {
  ApiError,
  InitResponse,
  Result,
  RoomResponse,
  ShareResponse,
  SolveResponse,
  Stats,
  Streak,
} from '../../shared/api';
import {
  type Room,
  cleanName,
  dateKey,
  parsePath,
  shareText,
  shiftDate,
  solve,
  validateRoom,
  verify,
} from '../../shared/game';
import { keys, loadPost, mondayOf, postUrl, savePost } from '../core/post';

export const api = new Hono();

const MAX_PATH = 400;

const getStats = async (postId: string): Promise<Stats> => {
  const [histogram, top, players] = await Promise.all([
    redis.hGetAll(keys.histogram(postId)),
    redis.zRange(keys.results(postId), 0, 9),
    redis.zCard(keys.results(postId)),
  ]);
  const counts: Record<string, number> = {};
  for (const [moves, n] of Object.entries(histogram)) counts[moves] = Number(n);
  return {
    players,
    histogram: counts,
    top: top.map(({ member, score }) => ({
      name: member,
      moves: Math.floor(score),
    })),
  };
};

const getStreak = async (
  username: string | undefined,
  today: string
): Promise<Streak> => {
  if (!username) return { current: 0, best: 0, solved: 0 };
  const u = await redis.hGetAll(keys.user(username));
  const last = u.last ?? '';
  const alive = last === today || last === shiftDate(today, -1);
  return {
    current: alive ? Number(u.streak ?? 0) : 0,
    best: Number(u.best ?? 0),
    solved: Number(u.solved ?? 0),
  };
};

const getResult = async (
  postId: string,
  username: string | undefined
): Promise<Result | null> => {
  if (!username) return null;
  const path = await redis.hGet(keys.paths(postId), username);
  return path ? { moves: path.length, path } : null;
};

const fail = (message: string): ApiError => ({ status: 'error', message });

api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) return c.json<ApiError>(fail('postId is required'), 400);
  try {
    const rec = await loadPost(postId);
    if (!rec)
      return c.json<ApiError>(
        fail('This room is still being furnished. Try again shortly.'),
        404
      );
    const today = dateKey(Date.now());
    const username = await reddit.getCurrentUsername();
    const [result, stats, streak, todayPostId] = await Promise.all([
      getResult(postId, username),
      getStats(postId),
      getStreak(username, today),
      redis.get(keys.daily(today)),
    ]);
    return c.json<InitResponse>({
      postId,
      kind: rec.kind,
      title: rec.title,
      subtitle: rec.subtitle,
      author: rec.author,
      puzzle: rec.puzzle,
      username: username ?? null,
      result,
      stats,
      streak,
      todayPostId: todayPostId ?? null,
    });
  } catch (error) {
    console.error(`init failed for ${postId}:`, error);
    return c.json<ApiError>(fail('Could not load the room'), 500);
  }
});

api.post('/solve', async (c) => {
  const { postId } = context;
  if (!postId) return c.json<ApiError>(fail('postId is required'), 400);
  const body: { path?: unknown } = await c.req.json();
  const path =
    typeof body.path === 'string' && body.path.length <= MAX_PATH
      ? parsePath(body.path)
      : null;
  const rec = await loadPost(postId);
  if (!rec || !path || !verify(rec.puzzle, path))
    return c.json<ApiError>(fail('That path does not herd the cats'), 400);

  const today = dateKey(Date.now());
  const username = await reddit.getCurrentUsername();
  const moves = path.length;
  let first = false;
  let result: Result = { moves, path: path.join('') };

  if (username) {
    // Only the first solve counts: no retrying a daily for a better score.
    first =
      (await redis.hSetNX(keys.paths(postId), username, result.path)) === 1;
    if (first) {
      // Fractional part keeps earlier finishers ahead on ties.
      const tie = ((Date.now() / 1000) % 1e7) / 1e7;
      await Promise.all([
        redis.zAdd(keys.results(postId), {
          member: username,
          score: moves + tie,
        }),
        redis.hIncrBy(keys.histogram(postId), String(moves), 1),
        redis.hIncrBy(keys.user(username), 'solved', 1),
      ]);
      if (rec.kind === 'daily' && rec.date === today) {
        const u = await redis.hGetAll(keys.user(username));
        if (u.last !== today) {
          const streak =
            u.last === shiftDate(today, -1) ? Number(u.streak ?? 0) + 1 : 1;
          await redis.hSet(keys.user(username), {
            last: today,
            streak: String(streak),
            best: String(Math.max(streak, Number(u.best ?? 0))),
          });
        }
      }
    } else {
      result = (await getResult(postId, username)) ?? result;
    }
  }

  const [stats, streak] = await Promise.all([
    getStats(postId),
    getStreak(username, today),
  ]);
  return c.json<SolveResponse>({ result, stats, streak, first });
});

/** Posts the player's spoiler-free score as a comment. Only ever called from an explicit button. */
api.post('/share', async (c) => {
  const { postId } = context;
  if (!postId) return c.json<ApiError>(fail('postId is required'), 400);
  const username = await reddit.getCurrentUsername();
  if (!username)
    return c.json<ShareResponse>({
      ok: false,
      message: 'Log in to share your score',
    });
  const [rec, result] = await Promise.all([
    loadPost(postId),
    getResult(postId, username),
  ]);
  if (!rec || !result)
    return c.json<ShareResponse>({ ok: false, message: 'Herd the cats first' });
  if (
    (await redis.hSetNX(keys.user(username), `shared:${postId}`, '1')) !== 1
  ) {
    return c.json<ShareResponse>({
      ok: false,
      message: 'You already shared this one',
    });
  }
  try {
    await reddit.submitComment({
      id: postId,
      text: shareText(
        rec.kind === 'community' ? cleanName(rec.title) : rec.title,
        result.moves,
        rec.puzzle.par
      ),
      runAs: 'USER',
    });
    return c.json<ShareResponse>({
      ok: true,
      message: 'Score posted to the comments',
    });
  } catch (error) {
    console.error('share failed:', error);
    await redis.hDel(keys.user(username), [`shared:${postId}`]);
    return c.json<ShareResponse>({
      ok: false,
      message: 'Could not post your comment',
    });
  }
});

const isRoom = (v: unknown): v is Room => {
  if (typeof v !== 'object' || v === null) return false;
  if (
    !('w' in v) ||
    !('h' in v) ||
    !('walls' in v) ||
    !('cats' in v) ||
    !('cushions' in v)
  )
    return false;
  const nums = (a: unknown) =>
    Array.isArray(a) && a.length <= 64 && a.every((n) => typeof n === 'number');
  return (
    typeof v.w === 'number' &&
    typeof v.h === 'number' &&
    nums(v.walls) &&
    nums(v.cats) &&
    nums(v.cushions)
  );
};

/** Publishes a player-built room as its own post, from the player's account. */
api.post('/room', async (c) => {
  const username = await reddit.getCurrentUsername();
  if (!username)
    return c.json<RoomResponse>({
      ok: false,
      message: 'Log in to publish a room',
    });
  const body: { room?: unknown; name?: unknown } = await c.req.json();
  const name = typeof body.name === 'string' ? cleanName(body.name) : '';
  if (!name)
    return c.json<RoomResponse>({
      ok: false,
      message: 'Give your room a name',
    });
  if (!isRoom(body.room))
    return c.json<RoomResponse>({
      ok: false,
      message: 'That room is not valid',
    });
  const room: Room = {
    w: body.room.w,
    h: body.room.h,
    walls: [...new Set(body.room.walls)],
    cats: body.room.cats,
    cushions: body.room.cushions,
  };
  const problem = validateRoom(room);
  if (problem) return c.json<RoomResponse>({ ok: false, message: problem });
  const best = solve(room);
  if (!best)
    return c.json<RoomResponse>({
      ok: false,
      message: 'No way to herd these cats. Rooms must be solvable.',
    });
  if (best.length < 3)
    return c.json<RoomResponse>({
      ok: false,
      message: 'Too easy: rooms need a par of at least 3',
    });

  const today = dateKey(Date.now());
  const made = await redis.hIncrBy(keys.user(username), `rooms:${today}`, 1);
  if (made > 3)
    return c.json<RoomResponse>({
      ok: false,
      message: 'Three rooms a day is plenty. Come back tomorrow!',
    });

  try {
    const title = `${name} (community room by u/${username})`;
    const post = await reddit.submitCustomPost({
      title,
      subredditName: context.subredditName,
      entry: 'default',
      runAs: 'USER',
      userGeneratedContent: { text: name },
      textFallback: {
        text: `${title}. A Herding Cats room with par ${best.length}.`,
      },
    });
    await savePost(post.id, {
      kind: 'community',
      title: name,
      subtitle: `Community room by u/${username}, par ${best.length}`,
      author: username,
      date: today,
      puzzle: { ...room, par: best.length },
    });
    // Next week's Sunday pick is drawn from rooms posted Monday to Saturday.
    await redis.zAdd(keys.week(mondayOf(today)), {
      member: post.id,
      score: Date.now(),
    });
    return c.json<RoomResponse>({
      ok: true,
      url: postUrl(post.id),
      par: best.length,
    });
  } catch (error) {
    console.error('room publish failed:', error);
    return c.json<RoomResponse>({
      ok: false,
      message: 'Could not publish your room',
    });
  }
});
