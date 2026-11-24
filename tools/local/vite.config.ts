import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Serves the real Hono API against in-memory mocks so the game runs without Reddit.
// ?post=t3_x picks the post, ?user=name the player, ?user= (empty) plays logged out,
// ?seed=1 fills today's room with fake herders.
const api = (): Plugin => ({
  name: 'local-devvit',
  configureServer(server) {
    let seeded = false;
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();
      try {
        const mock = await server.ssrLoadModule(here('./server-mock.ts'));
        const post = await server.ssrLoadModule(
          here('../../src/server/core/post.ts')
        );
        const { api: app } = await server.ssrLoadModule(
          here('../../src/server/routes/api.ts')
        );
        const ref = new URL(req.headers.referer ?? 'http://x/');
        const { postId: daily } = await post.ensureDailyPost();
        const call = async (
          path: string,
          user: string | undefined,
          postId: string,
          body?: unknown
        ) => {
          mock.state.username = user;
          mock.state.postId = postId;
          return app.fetch(
            new Request(`http://local${path}`, {
              method: body === undefined ? 'GET' : 'POST',
              headers: { 'content-type': 'application/json' },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            })
          );
        };
        if (ref.searchParams.has('seed') && !seeded) {
          seeded = true;
          const game = await server.ssrLoadModule(
            here('../../src/shared/game.ts')
          );
          const rec = await post.loadPost(daily);
          const best: string[] = game.solve(rec.puzzle);
          const names = [
            'tilted_tabby',
            'meowdulo',
            'catnip_dealer',
            'purrito42',
            'sir_floofs',
            'whisker_biscuit',
            'loaf_mode',
            'keyboard_cat',
            'zoomies_3am',
            'toe_beans',
            'mlem_lord',
            'nap_champion',
            'box_inspector',
            'void_kitty',
          ];
          const back: Record<string, string> = {
            U: 'D',
            D: 'U',
            L: 'R',
            R: 'L',
          };
          for (const [i, name] of names.entries()) {
            // Padding with a move and its repeat keeps the path valid but longer.
            const extra = [0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 5, 7][i] ?? 0;
            let path = '';
            for (let k = 0; k < 400 && !path; k++) {
              const pad = Array.from(
                { length: extra },
                () => 'UDLR'[Math.floor(Math.random() * 4)] ?? 'U'
              );
              const at = Math.floor(Math.random() * (best.length - 1));
              const cand = [...best.slice(0, at), ...pad, ...best.slice(at)];
              if (
                cand.length === best.length + extra &&
                game.verify(rec.puzzle, cand)
              )
                path = cand.join('');
            }
            void back;
            if (path) await call('/solve', name, daily, { path });
          }
        }
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c);
        const user = ref.searchParams.has('user')
          ? ref.searchParams.get('user') || undefined
          : 'you';
        const body = chunks.length
          ? JSON.parse(Buffer.concat(chunks).toString())
          : undefined;
        const out: Response = await call(
          req.url.slice(4),
          user,
          ref.searchParams.get('post') ?? daily,
          body
        );
        res.statusCode = out.status;
        res.setHeader('content-type', 'application/json');
        res.end(await out.text());
      } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end(JSON.stringify({ status: 'error', message: String(e) }));
      }
    });
  },
});

export default defineConfig({
  root: here('../../src/client'),
  plugins: [react(), api()],
  resolve: {
    alias: {
      '@devvit/web/server': here('./server-mock.ts'),
      '@devvit/web/client': here('./client-mock.ts'),
    },
  },
  server: { port: 5199, host: true },
});
