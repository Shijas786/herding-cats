// In-memory stand-ins for @devvit/web/server, for `npm run local` only.
const strings = new Map<string, string>();
const hashes = new Map<string, Map<string, string>>();
const zsets = new Map<string, Map<string, number>>();
const hash = (k: string) => hashes.get(k) ?? hashes.set(k, new Map()).get(k)!;
const zset = (k: string) => zsets.get(k) ?? zsets.set(k, new Map()).get(k)!;

export const state = {
  postId: 't3_local1',
  username: 'you' as string | undefined,
  n: 1,
};

export const context = {
  get postId() {
    return state.postId;
  },
  subredditName: 'herdingcats_dev',
};

export const redis = {
  get: async (k: string) => strings.get(k),
  set: async (k: string, v: string) => {
    strings.set(k, v);
    return 'OK';
  },
  hGetAll: async (k: string) => Object.fromEntries(hash(k)),
  hGet: async (k: string, f: string) => hash(k).get(f),
  hSet: async (k: string, fv: Record<string, string>) => {
    for (const [f, v] of Object.entries(fv)) hash(k).set(f, v);
    return 1;
  },
  hSetNX: async (k: string, f: string, v: string) => {
    if (hash(k).has(f)) return 0;
    hash(k).set(f, v);
    return 1;
  },
  hIncrBy: async (k: string, f: string, n: number) => {
    const v = Number(hash(k).get(f) ?? 0) + n;
    hash(k).set(f, String(v));
    return v;
  },
  hDel: async (k: string, fs: string[]) => {
    fs.forEach((f) => hash(k).delete(f));
    return fs.length;
  },
  zAdd: async (k: string, ...ms: { member: string; score: number }[]) => {
    ms.forEach((m) => zset(k).set(m.member, m.score));
    return ms.length;
  },
  zCard: async (k: string) => zset(k).size,
  zRange: async (k: string, start: number, stop: number) => {
    const all = [...zset(k)]
      .map(([member, score]) => ({ member, score }))
      .sort((a, b) => a.score - b.score);
    return all.slice(start, stop < 0 ? all.length + stop + 1 : stop + 1);
  },
};

export const reddit = {
  getCurrentUsername: async () => state.username,
  submitCustomPost: async (o: { title: string }) => {
    state.n += 1;
    console.log('[mock] post:', o.title);
    return { id: `t3_local${state.n}` };
  },
  submitComment: async (o: { text: string }) => {
    console.log('[mock] comment:', o.text);
    return { id: 't1_x' };
  },
  getPostById: async () => ({
    score: Math.floor(Math.random() * 50),
    isRemoved: () => false,
  }),
};
