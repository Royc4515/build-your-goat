// Shared Web Audio graph for the whole game. Everything is synthesized — there
// are no audio files to ship or license.
//
//   oscillators ───────────► sfxBus ───────────────┐
//   music nodes ─► musicBus (scheduler fade 0..1) ─► musicVol ─► master ─► out
//
// `master` is the mute toggle (gain 0 = silent). `sfxBus` is the user effects
// volume. `musicBus` is faded 0..1 by the music scheduler; `musicVol` is the
// independent user music volume, so the two never fight over one gain value.
// The context is created lazily on first use (browsers block audio until a
// user gesture). User volumes/enables live in `cfg` and apply on creation and
// on every change.

let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let musicVol = null;
let noise = null;
let muted = false;

// User audio config (fractions 0..1). Updated via setAudioConfig.
const cfg = {
  musicEnabled: true,
  musicVolume: 0.5,
  sfxEnabled: true,
  sfxVolume: 0.8,
};

const sfxTarget = () => (cfg.sfxEnabled ? cfg.sfxVolume : 0);
const musicTarget = () => (cfg.musicEnabled ? cfg.musicVolume : 0);

/**
 * Get (and lazily build) the audio graph, resuming it if a gesture suspended it.
 * @returns {{ctx:AudioContext, sfxBus:GainNode, musicBus:GainNode, musicVol:GainNode, master:GainNode}|null}
 */
export function audio() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();

    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxTarget();
    sfxBus.connect(master);

    musicVol = ctx.createGain();
    musicVol.gain.value = musicTarget();
    musicVol.connect(master);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0; // scheduler fades this 0..1 while music plays
    musicBus.connect(musicVol);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return { ctx, sfxBus, musicBus, musicVol, master };
}

/** A cached 2s white-noise buffer reused by swish/crowd/hi-hat sounds. */
export function noiseBuffer() {
  const a = audio();
  if (!a) return null;
  if (!noise) {
    const len = a.ctx.sampleRate * 2;
    noise = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/**
 * Apply user audio settings (enables + volumes). Ramps live if the graph
 * already exists; otherwise the values take effect when it's first built.
 * @param {Partial<{musicEnabled:boolean,musicVolume:number,sfxEnabled:boolean,sfxVolume:number}>} partial
 */
export function setAudioConfig(partial) {
  Object.assign(cfg, partial);
  if (!ctx) return;
  const t = ctx.currentTime;
  sfxBus.gain.setTargetAtTime(sfxTarget(), t, 0.03);
  musicVol.gain.setTargetAtTime(musicTarget(), t, 0.03);
}

/** Mute/unmute everything by ramping the master gain. */
export function setMuted(value) {
  muted = value;
  if (master && ctx) {
    master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  }
  return muted;
}

export function isMuted() {
  return muted;
}
