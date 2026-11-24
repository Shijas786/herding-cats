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

const noise = (dur: number, freq: number, gain: number): void => {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start();
  } catch {
    // Audio is a nicety; never let it break the game.
  }
};

/** A two-part glide that reads as "mew". Each cat has its own pitch. */
const meow = (pitch: number, at: number): void => {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch * 0.8, t);
    osc.frequency.linearRampToValueAtTime(pitch * 1.25, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, t + 0.26);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = pitch * 2;
    filter.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(filter).connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch {
    // Audio is a nicety; never let it break the game.
  }
};

const PITCH = [620, 520, 440, 700];

export const playSlide = (movedCats: readonly number[]): void => {
  noise(0.16, 900, 0.1);
  const who = movedCats[Math.floor(Math.random() * movedCats.length)];
  // Not every slide: a constant chorus gets old fast.
  if (who !== undefined && Math.random() < 0.4)
    meow(PITCH[who % PITCH.length] ?? 620, 0.05);
};
export const playNap = (): void => tone(330, 0.12, 0.25, 'sine', 0.1);
export const playBump = (): void => tone(90, 0, 0.08, 'sine', 0.15);
export const playWin = (cats: number): void => {
  [523, 659, 784, 1047].forEach((f, i) =>
    tone(f, i * 0.11, 0.3, 'triangle', 0.14)
  );
  for (let i = 0; i < cats; i++)
    meow(PITCH[i % PITCH.length] ?? 620, 0.5 + i * 0.16);
};
export const playTap = (): void => tone(520, 0, 0.05, 'square', 0.04);
