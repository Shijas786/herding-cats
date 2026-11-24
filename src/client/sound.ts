import { readStored, writeStored } from './storage';

let ctx: AudioContext | null = null;
let muted = readStored('hc:muted') === '1';

export const isMuted = (): boolean => muted;
export const setMuted = (m: boolean): void => {
  muted = m;
  writeStored('hc:muted', m ? '1' : '0');
};

const tone = (
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType,
  gain: number
): void => {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch {
    // Audio is a nicety; never let it break the game.
  }
};

export const playSlide = (): void => tone(220, 0, 0.12, 'triangle', 0.12);
export const playBump = (): void => tone(90, 0, 0.08, 'sine', 0.15);
export const playWin = (): void => {
  [523, 659, 784, 1047].forEach((f, i) =>
    tone(f, i * 0.11, 0.3, 'triangle', 0.14)
  );
};
