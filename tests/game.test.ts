import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TIERS,
  dailyPuzzle,
  generate,
  shiftDate,
  solve,
  tilt,
  validateRoom,
  cleanName,
  verify,
  weekdayIndex,
  dayNumber,
} from '../src/shared/game.ts';

test('cats slide until blocked and queue behind each other', () => {
  const room = { w: 4, h: 4, walls: [3], cats: [0, 1], cushions: [2, 1] };
  assert.deepEqual(tilt(room, room.cats, 'R'), [1, 2]);
  assert.deepEqual(tilt(room, room.cats, 'D'), [12, 13]);
});

test('solver finds a shortest verified path', () => {
  const room = { w: 4, h: 4, walls: [], cats: [0], cushions: [15] };
  const path = solve(room);
  assert.equal(path?.length, 2);
  assert.ok(path && verify(room, path));
  assert.equal(
    solve({ w: 4, h: 4, walls: [], cats: [0], cushions: [5] }),
    null
  );
});

test('daily rooms are deterministic, valid and hit the weekday par', () => {
  let key = '2026-11-23';
  assert.equal(weekdayIndex(key), 0);
  assert.equal(dayNumber(key), 1);
  for (let i = 0; i < 28; i++) {
    const p = dailyPuzzle(key);
    assert.deepEqual(p, dailyPuzzle(key));
    assert.equal(validateRoom(p), null);
    const path = solve(p);
    assert.equal(path?.length, p.par, key);
    assert.equal(p.par, TIERS[weekdayIndex(key)]?.par, key);
    key = shiftDate(key, 1);
  }
});

test('generation is fast enough for a request', () => {
  const t = Date.now();
  for (let i = 0; i < 5; i++) generate(`speed${i}`, TIERS[6]!);
  assert.ok(Date.now() - t < 5000);
});

test('room names lose markup but keep accents and word breaks', () => {
  assert.equal(cleanName('[x](http://a.b) **hi**'), 'xhttpab hi');
  assert.equal(cleanName('Cafe\u0301\u00a0nap'), 'Caf\u00e9 nap');
});
