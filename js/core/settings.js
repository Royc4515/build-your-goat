// Persistent user settings: a small immutable store backed by localStorage.
// Every update returns a fresh frozen object and notifies subscribers, so the
// rest of the app reacts to changes without anyone mutating shared state.

/**
 * @typedef {Object} Settings
 * @property {boolean} music         Background beat enabled.
 * @property {number}  musicVolume   0-100.
 * @property {boolean} sfx           Sound effects enabled.
 * @property {number}  sfxVolume     0-100.
 * @property {'chill'|'normal'|'hyper'} reelSpeed  How fast the reel cycles.
 * @property {boolean} spinFx        3D spin/motion-blur effect on the reel.
 * @property {'photos'|'jerseys'} cardArt  Real headshots, or CSS jersey art.
 */

const STORAGE_KEY = 'goat-settings';

/** @type {Readonly<Settings>} */
export const DEFAULT_SETTINGS = Object.freeze({
  music: true,
  musicVolume: 50,
  sfx: true,
  sfxVolume: 80,
  reelSpeed: 'normal',
  spinFx: true,
  cardArt: 'photos',
});

const REEL_SPEEDS = ['chill', 'normal', 'hyper'];
const CARD_ARTS = ['photos', 'jerseys'];

/** Coerce untrusted stored/JSON data back into a valid Settings object. */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const clampVol = (v, fallback) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : fallback;
  return {
    music: typeof raw.music === 'boolean' ? raw.music : DEFAULT_SETTINGS.music,
    musicVolume: clampVol(raw.musicVolume, DEFAULT_SETTINGS.musicVolume),
    sfx: typeof raw.sfx === 'boolean' ? raw.sfx : DEFAULT_SETTINGS.sfx,
    sfxVolume: clampVol(raw.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    reelSpeed: REEL_SPEEDS.includes(raw.reelSpeed) ? raw.reelSpeed : DEFAULT_SETTINGS.reelSpeed,
    spinFx: typeof raw.spinFx === 'boolean' ? raw.spinFx : DEFAULT_SETTINGS.spinFx,
    cardArt: CARD_ARTS.includes(raw.cardArt) ? raw.cardArt : DEFAULT_SETTINGS.cardArt,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return Object.freeze(sanitize(raw ? JSON.parse(raw) : null));
  } catch {
    return Object.freeze({ ...DEFAULT_SETTINGS });
  }
}

let state = load();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable (private mode); settings just won't persist */
  }
}

function emit() {
  for (const fn of listeners) fn(state);
}

/** Current settings (frozen — treat as read-only). */
export function getSettings() {
  return state;
}

/** Read a single setting value. */
export function getSetting(key) {
  return state[key];
}

/** Immutably set one key, persist, and notify subscribers. */
export function updateSetting(key, value) {
  const next = sanitize({ ...state, [key]: value });
  state = Object.freeze(next);
  persist();
  emit();
  return state;
}

/** Restore all defaults. */
export function resetSettings() {
  state = Object.freeze({ ...DEFAULT_SETTINGS });
  persist();
  emit();
  return state;
}

/** Subscribe to changes; returns an unsubscribe function. */
export function onSettingsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
