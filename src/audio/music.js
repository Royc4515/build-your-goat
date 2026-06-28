// Looping background beat — a laid-back arena/hip-hop groove, fully synthesized.
// Uses the standard Web Audio "lookahead scheduler": a JS timer wakes often and
// schedules any notes falling inside the next LOOKAHEAD window at sample-accurate
// times, so the groove stays tight even if the main thread hitches.

import { audio, noiseBuffer } from './context.js';

const BPM = 88;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const STEPS = 32; // two-bar loop
const LOOKAHEAD = 0.12; // schedule this far ahead (s)
const TICK_MS = 25; // scheduler wake interval

// 16-step (one bar) drum grid, reused across both bars.
const KICK = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0];
const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
const HAT = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];

// Two-bar bassline in A-minor pentatonic (Hz). null = rest.
const A1 = 55, C2 = 65.41, D2 = 73.42, E2 = 82.41, G2 = 98;
const BASS = [
  A1, null, null, A1, null, null, C2, null, D2, null, null, E2, null, null, C2, null,
  A1, null, null, A1, null, G2, null, null, E2, null, D2, null, null, C2, null, null,
];

let timer = null;
let nextNoteTime = 0;
let step = 0;
let playing = false;

/** Kick: sine with a quick pitch drop and snappy decay. */
function kick(ctx, bus, t) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  amp.gain.setValueAtTime(0.7, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(amp).connect(bus);
  osc.start(t);
  osc.stop(t + 0.22);
}

/** Snare: noise body + a short tonal crack. */
function snare(ctx, bus, t, buf) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1500;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.35, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  src.connect(hp).connect(amp).connect(bus);
  src.start(t);
  src.stop(t + 0.16);
}

/** Closed hi-hat: very short high-passed noise tick. */
function hat(ctx, bus, t, buf, accent) {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(accent ? 0.12 : 0.07, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  src.connect(hp).connect(amp).connect(bus);
  src.start(t);
  src.stop(t + 0.04);
}

/** Bass: warm triangle with a soft pluck envelope. */
function bass(ctx, bus, t, freq) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(0.3, t + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(amp).connect(bus);
  osc.start(t);
  osc.stop(t + 0.24);
}

/** Soft sustained chord pad once per bar for the "vibe". */
function pad(ctx, bus, t, freqs) {
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(0.05, t + 0.25);
  amp.gain.linearRampToValueAtTime(0.0001, t + STEP * 16);
  amp.connect(bus);
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.connect(amp);
    osc.start(t);
    osc.stop(t + STEP * 16 + 0.05);
  }
}

function scheduleStep(ctx, bus, buf, i, t) {
  const bar = i % 16;
  if (KICK[bar]) kick(ctx, bus, t);
  if (SNARE[bar]) snare(ctx, bus, t, buf);
  if (HAT[bar]) hat(ctx, bus, t, buf, bar % 4 === 0);
  const b = BASS[i];
  if (b) bass(ctx, bus, t, b);
  if (i === 0) pad(ctx, bus, t, [110, 130.81, 164.81]); // A minor
  if (i === 16) pad(ctx, bus, t, [87.31, 110, 130.81]); // F major
}

function loop() {
  const a = audio();
  if (!a || !playing) return;
  const buf = noiseBuffer();
  while (nextNoteTime < a.ctx.currentTime + LOOKAHEAD) {
    scheduleStep(a.ctx, a.musicBus, buf, step, nextNoteTime);
    nextNoteTime += STEP;
    step = (step + 1) % STEPS;
  }
  timer = window.setTimeout(loop, TICK_MS);
}

/** Start (or no-op if already running). Fades the music bus up. */
export function startMusic() {
  const a = audio();
  if (!a || playing) return;
  playing = true;
  const now = a.ctx.currentTime;
  a.musicBus.gain.cancelScheduledValues(now);
  a.musicBus.gain.setValueAtTime(a.musicBus.gain.value, now);
  // Fade the scheduler bus to full; user music volume lives on musicVol.
  a.musicBus.gain.linearRampToValueAtTime(1, now + 1.5);
  step = 0;
  nextNoteTime = now + 0.1;
  loop();
}

/** Stop the groove and fade the bus out. */
export function stopMusic() {
  if (!playing) return;
  playing = false;
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
  const a = audio();
  if (a) {
    const now = a.ctx.currentTime;
    a.musicBus.gain.cancelScheduledValues(now);
    a.musicBus.gain.setValueAtTime(a.musicBus.gain.value, now);
    a.musicBus.gain.linearRampToValueAtTime(0, now + 0.4);
  }
}

export function isPlaying() {
  return playing;
}
