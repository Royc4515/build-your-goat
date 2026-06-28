// The match state machine — pure, immutable, deterministic. Every transition
// returns a NEW frozen MatchState; nothing is mutated in place. This generalizes
// the original core/state.js play loop: the seeded reel order lives in state, the
// PRNG counter is serialized, so a whole match replays bit-for-bit from its seed.
//
// M1 supports solo play over the full roster. Later milestones extend the SAME
// machine: a draining pool (M2), economy power-ups (M3), and a draft order with
// AI/human opponents (M5) — none of which change these core transitions' shape.

import type {
  BuildResult,
  Category,
  MatchConfig,
  MatchState,
  PlayerId,
} from '../types.js';
import { categoriesForMode, rosterForMode } from '../../data/modes.js';
import { scoreBuild } from '../scoring/scoring.js';
import { makeRng, shuffle } from '../rng.js';
import { createPool, removeFromPool, isAvailable } from '../pool/pool.js';
import { initEconomy, canReroll, canFreeze, spendReroll, spendFreeze } from '../economy/economy.js';

/** Begin a fresh match. The seed fully determines the draft pool order. */
export function createMatch(config: MatchConfig): MatchState {
  const rng = makeRng(config.seed);
  const pool = createPool(
    rng.next,
    rosterForMode(config.mode).map((p) => p.id),
  );
  return Object.freeze({
    config,
    phase: 'spinning',
    round: 0,
    picks: Object.freeze({}),
    pool,
    economy: initEconomy(),
    frozen: false,
    rngState: rng.state(),
    reveal: null,
  });
}

/** The category for the current round, or null once every slot is filled. */
export function currentCategory(state: MatchState): Category | null {
  const categories = categoriesForMode(state.config.mode);
  return categories[state.round] ?? null;
}

/**
 * Lock the chosen player into the current category. The round does NOT advance
 * yet — `reveal` is set so the pick can be shown; advanceAfterReveal() moves on.
 * No-op if there's nothing to lock or a reveal is already pending.
 */
export function lockPick(state: MatchState, playerId: PlayerId): MatchState {
  const category = currentCategory(state);
  if (!category || state.reveal) return state;
  if (!isAvailable(state.pool, playerId)) return state; // drained players can't be re-picked

  return Object.freeze({
    ...state,
    phase: 'reveal',
    picks: Object.freeze({ ...state.picks, [category.id]: playerId }),
    pool: removeFromPool(state.pool, playerId),
    reveal: Object.freeze({ categoryId: category.id, playerId }),
  });
}

/** Finish the reveal and advance to the next round (or to the result). */
export function advanceAfterReveal(state: MatchState): MatchState {
  if (!state.reveal) return state;
  const nextRound = state.round + 1;
  const done = nextRound >= categoriesForMode(state.config.mode).length;
  return Object.freeze({
    ...state,
    phase: done ? 'result' : 'spinning',
    round: nextRound,
    frozen: false, // a spent Freeze only lasts its round
    reveal: null,
  });
}

/**
 * Spend a Reroll: reshuffle the remaining pool (refresh which faces appear) using
 * the match's continued PRNG stream — deterministic given the seed. No-op unless
 * a reroll is available and the reel is live (spinning, no pending reveal).
 */
export function useReroll(state: MatchState): MatchState {
  if (state.phase !== 'spinning' || state.reveal || !canReroll(state.economy)) return state;
  const rng = makeRng(state.rngState);
  const available = Object.freeze(shuffle(rng.next, state.pool.available));
  return Object.freeze({
    ...state,
    pool: Object.freeze({ order: state.pool.order, available }),
    economy: spendReroll(state.economy),
    rngState: rng.state(),
  });
}

/**
 * Spend a Freeze: slow the current round's reel for a more precise lock. No-op
 * unless a freeze is available, the round isn't already frozen, and the reel is
 * live.
 */
export function useFreeze(state: MatchState): MatchState {
  if (state.phase !== 'spinning' || state.reveal || state.frozen || !canFreeze(state.economy)) {
    return state;
  }
  return Object.freeze({
    ...state,
    economy: spendFreeze(state.economy),
    frozen: true,
  });
}

/** True once the build is complete. */
export function isComplete(state: MatchState): boolean {
  return state.phase === 'result';
}

/** Score the completed build. Throws if called before the match is done. */
export function matchResult(state: MatchState): BuildResult {
  return scoreBuild(state.picks, state.config.mode);
}
