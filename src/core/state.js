// Immutable game state + pure transitions.
// Every transition returns a NEW state object; nothing is mutated in place.
// main.js owns the single "current" reference and swaps it on each transition.
//
// The active `mode` (NBA / EuroLeague / Soccer · legends/current/…) drives which
// category set and roster the round + scoring use, so the same engine plays
// every sport.

import { categoriesForMode, totalRoundsForMode, DEFAULT_MODE } from '../data/modes.js';

/** @typedef {'intro'|'modeSelect'|'playing'|'result'|'settings'} Phase */

/**
 * @typedef {Object} GameState
 * @property {Phase} phase
 * @property {string} mode                  Active mode id (see data/modes.js).
 * @property {number} round                 Index into the mode's categories.
 * @property {Readonly<Record<string,string>>} picks  categoryId -> playerId.
 * @property {Readonly<{categoryId:string,playerId:string}>|null} reveal
 *   When set, a pick was just locked and is being shown before advancing.
 */

/** @returns {GameState} */
export function createInitialState() {
  return Object.freeze({ phase: 'intro', mode: DEFAULT_MODE, round: 0, picks: Object.freeze({}), reveal: null });
}

/** Open the mode-select screen (reached from the title screen). */
export function openModeSelect() {
  return Object.freeze({ phase: 'modeSelect', mode: DEFAULT_MODE, round: 0, picks: Object.freeze({}), reveal: null });
}

/** Begin a fresh playthrough in the chosen mode. */
export function startGame(mode) {
  return Object.freeze({ phase: 'playing', mode, round: 0, picks: Object.freeze({}), reveal: null });
}

/** The category for the current round, or null once the build is done. */
export function currentCategory(state) {
  const categories = categoriesForMode(state.mode);
  return state.round < categories.length ? categories[state.round] : null;
}

/**
 * Lock the chosen player into the current category. The round does NOT advance
 * yet — `reveal` is set so the pick can be shown; advanceAfterReveal() moves on.
 * @returns {GameState}
 */
export function lockPick(state, playerId) {
  const category = currentCategory(state);
  if (!category || state.reveal) return state; // nothing to lock / already revealing

  const picks = Object.freeze({ ...state.picks, [category.id]: playerId });
  return Object.freeze({
    phase: 'playing',
    mode: state.mode,
    round: state.round,
    picks,
    reveal: Object.freeze({ categoryId: category.id, playerId }),
  });
}

/**
 * Finish the reveal and move to the next round (or to the result once done).
 * @returns {GameState}
 */
export function advanceAfterReveal(state) {
  if (!state.reveal) return state;
  const nextRound = state.round + 1;
  const done = nextRound >= totalRoundsForMode(state.mode);
  return Object.freeze({
    phase: done ? 'result' : 'playing',
    mode: state.mode,
    round: nextRound,
    picks: state.picks,
    reveal: null,
  });
}

/** Open the settings screen (reachable from the title screen). */
export function openSettings() {
  return Object.freeze({ phase: 'settings', mode: DEFAULT_MODE, round: 0, picks: Object.freeze({}), reveal: null });
}

/** Back to the title screen. */
export function reset() {
  return createInitialState();
}
