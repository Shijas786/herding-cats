import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { requestExpandedMode } from '@devvit/web/client';
import type { InitResponse } from '../shared/api';
import { starsFor } from '../shared/game';
import { Flame, Paw, Star } from './icons';
import { Logo } from './art';
import { Board } from './Board';
import { ApiFailure, call } from './api';

export const Splash = () => {
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

  const { puzzle, result, stats } = init;
  return (
    <div className="splash">
      <div className="mini">
        <Board room={puzzle} cats={puzzle.cats} />
      </div>
      <div className="info">
        <Logo />
        <h1>{init.title.replace(/^Herding Cats /, '')}</h1>
        <p className="sub2">{init.subtitle}</p>
        <p>
          {result ? (
            <>
              You herded in {result.moves}{' '}
              {[1, 2, 3].map((i) => (
                <Star key={i} on={i <= starsFor(result.moves, puzzle.par)} />
              ))}
            </>
          ) : (
            'One swipe moves every cat. Get them all onto cushions.'
          )}
        </p>
        <button
          className="btn primary"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          {result ? (
            'See how everyone did'
          ) : (
            <>
              <Paw /> Herd the cats
            </>
          )}
        </button>
        <p>
          {stats.players > 0
            ? `${stats.players} herder${stats.players === 1 ? '' : 's'} so far`
            : 'Be the first herder today'}
          {init.streak.current > 0 && (
            <>
              {' '}
              · <Flame /> {init.streak.current} day streak
            </>
          )}
        </p>
      </div>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Splash />
    </StrictMode>
  );
}
