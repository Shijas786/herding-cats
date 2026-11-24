import { useEffect, useState } from 'react';
import type { InitResponse, Result, Stats, Streak } from '../shared/api';
import { starsFor } from '../shared/game';
import { Flame, Star } from './icons';

const untilNextRoom = (): string => {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  const s = Math.max(0, Math.floor((next - now.getTime()) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

const VERDICT = ['', 'Herded. Eventually.', 'Nicely herded!', 'Purrfect!'];

type Props = {
  init: InitResponse;
  result: Result;
  stats: Stats;
  streak: Streak;
  shared: boolean;
  onShare: () => void;
  onBuild: () => void;
  onReplay: () => void;
  onToday: (() => void) | null;
  onClose: () => void;
};

export const Results = ({
  init,
  result,
  stats,
  streak,
  shared,
  onShare,
  onBuild,
  onReplay,
  onToday,
  onClose,
}: Props) => {
  const [clock, setClock] = useState(untilNextRoom);
  useEffect(() => {
    const id = setInterval(() => setClock(untilNextRoom()), 1000);
    return () => clearInterval(id);
  }, []);

  const { par } = init.puzzle;
  const stars = starsFor(result.moves, par);
  const rows = Object.entries(stats.histogram)
    .map(([m, n]) => ({ moves: Number(m), n }))
    .sort((a, b) => a.moves - b.moves);
  const max = Math.max(1, ...rows.map((r) => r.n));
  const beaten = rows
    .filter((r) => r.moves > result.moves)
    .reduce((a, r) => a + r.n, 0);
  const loggedIn = init.username !== null;

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Results"
      >
        <h2>{VERDICT[stars]}</h2>
        <div className="stars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((i) => (
            <span key={i}>
              <Star on={i <= stars} />
            </span>
          ))}
        </div>
        <p className="sub">
          {result.moves} move{result.moves === 1 ? '' : 's'} · par {par}
          {stats.players > 1 && beaten > 0
            ? ` · beat ${Math.round((beaten / stats.players) * 100)}% of herders`
            : ''}
        </p>

        {loggedIn && (
          <div className="kpis">
            <div className="kpi">
              <b>
                <Flame /> {streak.current}
              </b>
              <span>day streak</span>
            </div>
            <div className="kpi">
              <b>{streak.best}</b>
              <span>best streak</span>
            </div>
            <div className="kpi">
              <b>{streak.solved}</b>
              <span>rooms herded</span>
            </div>
          </div>
        )}

        <div className="row">
          {loggedIn && (
            <button className="btn primary" onClick={onShare} disabled={shared}>
              {shared ? 'Score posted' : 'Comment my score'}
            </button>
          )}
          <button className="btn" onClick={onBuild}>
            Build a room
          </button>
        </div>
        <div className="row" style={{ margin: '8px 0 12px' }}>
          <button className="btn" onClick={onReplay}>
            Replay for fun
          </button>
          {onToday && (
            <button className="btn" onClick={onToday}>
              Today's room
            </button>
          )}
        </div>
        {rows.length > 0 && (
          <div className="card">
            <h3>
              How everyone did · {stats.players} herder
              {stats.players === 1 ? '' : 's'}
            </h3>
            <div className="bars">
              {rows.map((r) => (
                <div className="bar-row" key={r.moves}>
                  <span className="n">{r.moves}</span>
                  <div
                    className={`bar ${r.moves === result.moves ? 'me' : ''}`}
                    style={{ width: `${(r.n / max) * 70}%` }}
                  />
                  <span className="c">
                    {r.n}
                    {r.moves === par ? ' · par' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.top.length > 0 && (
          <div className="card">
            <h3>Top herders</h3>
            <ol className="lb">
              {stats.top.map((t, i) => (
                <li
                  key={t.name}
                  className={t.name === init.username ? 'me' : ''}
                >
                  <span>
                    {i + 1}. u/{t.name}
                  </span>
                  <span>{t.moves} moves</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!loggedIn && (
          <p className="sub">
            Log in to Reddit to keep a streak and join the leaderboard.
          </p>
        )}

        <p className="hint" style={{ marginTop: 10 }}>
          {loggedIn
            ? 'Commenting posts your move count (no spoilers) from your account. '
            : ''}
          Next room in {clock}
        </p>
      </div>
    </div>
  );
};
