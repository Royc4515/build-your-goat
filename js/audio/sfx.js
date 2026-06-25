// Basketball sound effects, all synthesized via Web Audio (no asset files).
// Each helper grabs the shared graph, builds a few short-lived nodes, schedules
// an envelope, and lets them auto-stop. Any failure is swallowed so a missing
// audio API can never interrupt gameplay.

import { audio, noiseBuffer } from './context.js';

/** Dribble: a low sine "thump" with a fast downward pitch drop. */
function bounce({ freq = 170, gain = 0.22 } = {}) {
  const a = audio();
  if (!a) return;
  try {
    const { ctx, sfxBus } = a;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.09);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(amp).connect(sfxBus);
    osc.start(t);
    osc.stop(t + 0.14);
  } catch {
    /* audio is optional */
  }
}

/** Net swish: a short band-passed noise burst sweeping downward. */
function swish() {
  const a = audio();
  const buf = noiseBuffer();
  if (!a || !buf) return;
  try {
    const { ctx, sfxBus } = a;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(5200, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + 0.2);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(0.3, t + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    src.connect(bp).connect(amp).connect(sfxBus);
    src.start(t);
    src.stop(t + 0.26);
  } catch {
    /* audio is optional */
  }
}

/** Game buzzer: a harsh sustained sawtooth pair. */
function buzzer() {
  const a = audio();
  if (!a) return;
  try {
    const { ctx, sfxBus } = a;
    const t = ctx.currentTime;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(0.16, t + 0.02);
    amp.gain.setValueAtTime(0.16, t + 0.5);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    amp.connect(sfxBus);
    for (const f of [196, 200]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.connect(amp);
      osc.start(t);
      osc.stop(t + 0.64);
    }
  } catch {
    /* audio is optional */
  }
}

/** Arena crowd: a slow noise swell, band-passed to a roar. */
function crowd() {
  const a = audio();
  const buf = noiseBuffer();
  if (!a || !buf) return;
  try {
    const { ctx, sfxBus } = a;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.4;
    bp.frequency.value = 1100;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(0.13, t + 0.35);
    amp.gain.setValueAtTime(0.13, t + 0.7);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    src.connect(bp).connect(amp).connect(sfxBus);
    src.start(t);
    src.stop(t + 1.7);
  } catch {
    /* audio is optional */
  }
}

export const sfx = Object.freeze({
  // Reel cycling reads as a dribble; pitch wobbles a touch so it feels live.
  tick: () => bounce({ freq: 150 + Math.random() * 60, gain: 0.14 }),
  // Locking a pick = a made bucket: swish + a quick crowd pop.
  lock: () => {
    swish();
    setTimeout(crowd, 90);
  },
  // The final reveal: buzzer then the crowd erupts.
  reveal: () => {
    buzzer();
    setTimeout(crowd, 240);
  },
  // UI taps get a crisp high dribble.
  click: () => bounce({ freq: 280, gain: 0.16 }),
});
