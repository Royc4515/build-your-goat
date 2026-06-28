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

/** Begin a fresh match. The seed fully determines the reel order. */
export function createMatch(config: MatchConfig): MatchState {
  const rng = makeRng(config.seed);
  const order = shuffle(
    rng.next,
    rosterForMode(config.mode).map((p) => p.id),
  );
  return Object.freeze({
    config,
    phase: 'spinning',
    round: 0,
    picks: Object.freeze({}),
    order: Object.freeze(order),
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

  return Object.freeze({
    ...state,
    phase: 'reveal',
    picks: Object.freeze({ ...state.picks, [category.id]: playerId }),
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
    reveal: null,
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
