import './index.css';

import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo, showToast } from '@devvit/web/client';
import type {
  InitResponse,
  Result,
  ShareResponse,
  SolveResponse,
  Stats,
  Streak,
} from '../shared/api';
import { type Dir, isSolved, parsePath, tilt, verify } from '../shared/game';
import { Board } from './Board';
import { Builder } from './Builder';
import { Results } from './Results';
import { Flame } from './icons';
import { ApiFailure, call } from './api';
import { readStored, writeStored } from './storage';
import { isMuted, playBump, playSlide, playWin, setMuted } from './sound';

const KEYS: Record<string, Dir> = {
  ArrowUp: 'U',
  ArrowDown: 'D',
  ArrowLeft: 'L',
  ArrowRight: 'R',
  w: 'U',
  s: 'D',
  a: 'L',
  d: 'R',
};

const same = (a: readonly number[], b: readonly number[]) =>
  a.every((v, i) => v === b[i]);

const Game = ({ init }: { init: InitResponse }) => {
  const room = init.puzzle;
  const localKey = `hc:result:${init.postId}`;
  const guest = init.username === null;
  // Signed-in players get their result from the server; guests keep theirs in this browser.
  // Either way a finished player comes back to their napping cats and the results.
  const [first] = useState<Result | null>(() => {
    if (init.result) return init.result;
    const saved = guest ? readStored(localKey) : null;
    const valid = saved ? parsePath(saved) : null;
    return saved && valid && verify(room, valid)
      ? { moves: saved.length, path: saved }
      : null;
  });
  const [history, setHistory] = useState<number[][]>(() => {
    const h = [room.cats];
    for (const d of (first && parsePath(first.path)) ?? []) {
      h.push(tilt(room, h[h.length - 1] ?? room.cats, d));
    }
    return h;
  });
  const [path, setPath] = useState<Dir[]>(
    () => (first && parsePath(first.path)) ?? []
  );
  const [result, setResult] = useState<Result | null>(first);
  const [stats, setStats] = useState<Stats>(init.stats);
  const [streak, setStreak] = useState<Streak>(init.streak);
  const [sheet, setSheet] = useState(first !== null);
  const [shared, setShared] = useState(false);
  const [building, setBuilding] = useState(false);
  const [shake, setShake] = useState<Dir | null>(null);
  const [muted, setMute] = useState(isMuted);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const cats = history[history.length - 1] ?? room.cats;
  const solved = isSolved(room, cats);

  const finish = useCallback(
    async (full: Dir[]) => {
      playWin();
      const text = full.join('');
      try {
        const res = await call<SolveResponse>('/api/solve', { path: text });
        // The server keeps a signed-in player's first solve; guests keep theirs here.
        const kept = guest
          ? (readStored(localKey) ?? res.result.path)
          : res.result.path;
        setResult({ moves: kept.length, path: kept });
        setStats(res.stats);
        setStreak(res.streak);
        if (guest) writeStored(localKey, kept);
      } catch {
        setResult((r) => r ?? { moves: full.length, path: text });
      }
      setTimeout(() => setSheet(true), 650);
    },
    [guest, localKey]
  );

  const move = useCallback(
    (dir: Dir) => {
      if (solved || building || sheet) return;
      const next = tilt(room, cats, dir);
      if (same(next, cats)) {
        playBump();
        setShake(dir);
        setTimeout(() => setShake(null), 180);
        return;
      }
      playSlide();
      const full = [...path, dir];
      setHistory((h) => [...h, next]);
      setPath(full);
      if (isSolved(room, next)) void finish(full);
    },
    [building, cats, finish, path, room, sheet, solved]
  );

  const undo = () => {
    if (solved || history.length < 2) return;
    setHistory((h) => h.slice(0, -1));
    setPath((p) => p.slice(0, -1));
  };
  const reset = () => {
    setHistory([room.cats]);
    setPath([]);
    setSheet(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shortcuts belong to the board only: never while building a room or reading results.
      if (building || sheet) return;
      const dir = KEYS[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      } else if (e.key === 'z' || e.key === 'Backspace') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const share = async () => {
    try {
      const res = await call<ShareResponse>('/api/share', {});
      showToast(res.message);
      if (res.ok) setShared(true);
    } catch (error) {
      showToast(
        error instanceof ApiFailure
          ? error.message
          : 'Could not post your comment'
      );
    }
  };

  if (building)
    return (
      <Builder
        canPublish={init.username !== null}
        onBack={() => setBuilding(false)}
      />
    );

  const moves = path.length;
  const todayElsewhere =
    init.todayPostId !== null && init.todayPostId !== init.postId
      ? init.todayPostId
      : null;

  return (
    <div className="app">
      <div className="top">
        <h1>
          {init.title}
          <small>{init.subtitle}</small>
        </h1>
        {init.username !== null && (
          <span className="chip" title="Daily streak">
            <Flame /> {streak.current}
          </span>
        )}
        <button
          className="icon-btn"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => {
            setMuted(!muted);
            setMute(!muted);
          }}
        >
          {muted ? <s>♪</s> : '♪'}
        </button>
      </div>
      <div className="hud">
        <div className={`moves ${moves > room.par ? 'over' : ''}`}>
          {moves} <span>moves · par {room.par}</span>
        </div>
        <span className="chip">{stats.players} herded today</span>
      </div>
      <div
        className="stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = drag.current;
          drag.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          move(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? 'R'
                : 'L'
              : dy > 0
                ? 'D'
                : 'U'
          );
        }}
      >
        <Board room={room} cats={cats} shake={shake} />
      </div>
      <p className="hint">
        {solved
          ? 'All cats napping.'
          : moves === 0
            ? 'Swipe to tilt the room. Every cat slides until it bumps something. Park them all on cushions.'
            : result
              ? 'Replaying for fun. Your first solve is the one that counts.'
              : 'Fewer moves, more stars. Only your first solve counts.'}
      </p>
      <div className="controls">
        <div className="side">
          <button
            className="btn"
            onClick={undo}
            disabled={solved || moves === 0}
          >
            Undo
          </button>
          <button className="btn" onClick={reset} disabled={moves === 0}>
            Reset
          </button>
        </div>
        <div className="dpad" aria-label="Tilt controls">
          <button className="up" onClick={() => move('U')} aria-label="Tilt up">
            ▲
          </button>
          <button
            className="left"
            onClick={() => move('L')}
            aria-label="Tilt left"
          >
            ◀
          </button>
          <button
            className="down"
            onClick={() => move('D')}
            aria-label="Tilt down"
          >
            ▼
          </button>
          <button
            className="right"
            onClick={() => move('R')}
            aria-label="Tilt right"
          >
            ▶
          </button>
        </div>
        <div className="side">
          <button className="btn" onClick={() => setBuilding(true)}>
            Build
          </button>
          <button
            className="btn"
            onClick={() => setSheet(true)}
            disabled={!result}
          >
            Stats
          </button>
        </div>
      </div>
      {sheet && result && (
        <Results
          init={init}
          result={result}
          stats={stats}
          streak={streak}
          shared={shared}
          onShare={() => void share()}
          onBuild={() => {
            setSheet(false);
            setBuilding(true);
          }}
          onReplay={reset}
          onToday={
            todayElsewhere
              ? () =>
                  navigateTo(
                    `https://reddit.com/comments/${todayElsewhere.replace('t3_', '')}`
                  )
              : null
          }
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
};

export const App = () => {
  const [init, setInit] = useState<InitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    call<InitResponse>('/api/init')
      .then(setInit)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiFailure ? e.message : 'Could not load the room'
        )
      );
  }, []);
  if (error) return <div className="center">{error}</div>;
  if (!init) return <div className="center">Waking the cats…</div>;
  return <Game init={init} />;
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
