// Immutable game state + pure transitions.
// Every transition returns a NEW state object; nothing is mutated in place.
// main.js owns the single "current" reference and swaps it on each transition.

import { CATEGORIES, TOTAL_ROUNDS } from '../data/categories.js';

/** @typedef {'intro'|'playing'|'result'|'settings'} Phase */

/**
 * @typedef {Object} GameState
 * @property {Phase} phase
 * @property {number} round                 Index into CATEGORIES (0-based).
 * @property {Readonly<Record<string,string>>} picks  categoryId -> playerId.
 */

/** @returns {GameState} */
export function createInitialState() {
  return Object.freeze({ phase: 'intro', round: 0, picks: Object.freeze({}) });
}

/** Begin a fresh playthrough from the intro screen. */
export function startGame() {
  return Object.freeze({ phase: 'playing', round: 0, picks: Object.freeze({}) });
}

/** The category for the current round, or null once the build is done. */
export function currentCategory(state) {
  return state.round < TOTAL_ROUNDS ? CATEGORIES[state.round] : null;
}

/**
 * Lock the chosen player into the current category and advance.
 * Advancing past the final round flips the phase to 'result'.
 * @returns {GameState}
 */
export function lockPick(state, playerId) {
  const category = currentCategory(state);
  if (!category) return state; // nothing to lock; ignore stray calls

  const picks = Object.freeze({ ...state.picks, [category.id]: playerId });
  const nextRound = state.round + 1;
  const done = nextRound >= TOTAL_ROUNDS;

  return Object.freeze({
    phase: done ? 'result' : 'playing',
    round: nextRound,
    picks,
  });
}

/** Open the settings screen (reachable from the title screen). */
export function openSettings() {
  return Object.freeze({ phase: 'settings', round: 0, picks: Object.freeze({}) });
}

/** Back to the title screen. */
export function reset() {
  return createInitialState();
}
