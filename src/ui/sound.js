// Public audio facade for the UI. Re-exports the basketball SFX and exposes a
// single mute toggle, background-music controls, and a settings applier. The
// actual synthesis lives in ../audio/* so the UI never touches the graph.

import { setMuted, isMuted, setAudioConfig } from '../audio/context.js';
import { startMusic, stopMusic, isPlaying } from '../audio/music.js';

export { sfx } from '../audio/sfx.js';

/** Toggle mute for both effects and music. Returns the new muted state. */
export function toggleMute() {
  return setMuted(!isMuted());
}

export const music = Object.freeze({
  start: startMusic,
  stop: stopMusic,
  isPlaying,
});

/**
 * Push user settings into the audio engine (enables + 0-100 volumes).
 * @param {import('../core/settings.js').Settings} s
 */
export function applyAudioSettings(s) {
  setAudioConfig({
    musicEnabled: s.music,
    musicVolume: s.musicVolume / 100,
    sfxEnabled: s.sfx,
    sfxVolume: s.sfxVolume / 100,
  });
}
