import { useMemo, useState } from 'react';
import { navigateTo, showToast } from '@devvit/web/client';
import type { RoomResponse } from '../shared/api';
import { type Room, MAX_CATS, solve, validateRoom } from '../shared/game';
import { Board } from './Board';
import { ApiFailure, call } from './api';

type Tool = 'wall' | 'cat' | 'cushion' | 'erase';
const TOOLS: { id: Tool; label: string }[] = [
  { id: 'wall', label: 'Furniture' },
  { id: 'cat', label: 'Cat' },
  { id: 'cushion', label: 'Cushion' },
  { id: 'erase', label: 'Erase' },
];

const empty = (size: number): Room => ({
  w: size,
  h: size,
  walls: [],
  cats: [],
  cushions: [],
});

export const Builder = ({
  canPublish,
  onBack,
}: {
  canPublish: boolean;
  onBack: () => void;
}) => {
  const [room, setRoom] = useState<Room>(() => empty(6));
  const [tool, setTool] = useState<Tool>('wall');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const check = useMemo(() => {
    const problem = validateRoom(room);
    if (problem) return { ok: false, text: problem };
    const path = solve(room);
    if (!path) return { ok: false, text: 'No way to herd these cats yet' };
    if (path.length < 3)
      return {
        ok: false,
        text: `Too easy (par ${path.length}). Aim for 3 or more.`,
      };
    return { ok: true, text: `Solvable! Par ${path.length}` };
  }, [room]);

  const onCell = (cell: number) => {
    setRoom((r) => {
      const without = (a: number[]) => a.filter((c) => c !== cell);
      if (tool === 'erase')
        return {
          ...r,
          walls: without(r.walls),
          cats: without(r.cats),
          cushions: without(r.cushions),
        };
      if (tool === 'wall') {
        return r.walls.includes(cell)
          ? { ...r, walls: without(r.walls) }
          : {
              ...r,
              walls: [...r.walls, cell],
              cats: without(r.cats),
              cushions: without(r.cushions),
            };
      }
      if (tool === 'cat') {
        if (r.cats.includes(cell)) return { ...r, cats: without(r.cats) };
        if (r.cats.length >= MAX_CATS) return r;
        return { ...r, cats: [...r.cats, cell], walls: without(r.walls) };
      }
      if (r.cushions.includes(cell))
        return { ...r, cushions: without(r.cushions) };
      if (r.cushions.length >= MAX_CATS) return r;
      return { ...r, cushions: [...r.cushions, cell], walls: without(r.walls) };
    });
  };

  const publish = async () => {
    setBusy(true);
    try {
      const res = await call<RoomResponse>('/api/room', { room, name });
      if (res.ok) {
        showToast(`Room published with par ${res.par}!`);
        navigateTo(res.url);
      } else {
        showToast(res.message);
      }
    } catch (error) {
      showToast(
        error instanceof ApiFailure
          ? error.message
          : 'Could not publish your room'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <h1>
          Build a room
          <small>Top-voted room becomes Sunday's daily</small>
        </h1>
        {[5, 6, 7].map((s) => (
          <button
            key={s}
            className="chip"
            style={{ borderColor: room.w === s ? 'var(--accent)' : undefined }}
            onClick={() => setRoom(empty(s))}
          >
            {s}×{s}
          </button>
        ))}
      </div>
      <div className="tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={tool === t.id ? 'on' : ''}
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="stage">
        <Board room={room} cats={room.cats} onCell={onCell} />
      </div>
      <div className={`status ${check.ok ? 'ok' : 'bad'}`}>{check.text}</div>
      <input
        className="field"
        placeholder="Name your room"
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className="btn primary"
        style={{ width: '100%' }}
        disabled={!check.ok || !name.trim() || busy || !canPublish}
        onClick={() => void publish()}
      >
        {canPublish
          ? busy
            ? 'Publishing…'
            : 'Post this room to the subreddit'
          : 'Log in to publish rooms'}
      </button>
      <p className="hint">
        Publishing creates a post from your Reddit account. Every room is
        checked by the solver first.
      </p>
    </div>
  );
};
