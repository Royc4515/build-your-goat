// The match state machine — pure, immutable, deterministic. Every transition
// returns a NEW frozen MatchState; nothing is mutated in place. The seeded pool
// order and the PRNG counter live in state, so a whole match (including the CPU's
// picks) replays bit-for-bit from its seed.
//
// ONE machine drives every mode. Solo = a single 'human' actor over the six
// categories. vsAI/hotseat add actors and a snake draft order; daily just fixes
// the seed. Only setup differs — these transitions are shared.

import type {
  ActorId,
  Board,
  BuildResult,
  Category,
  MatchConfig,
  MatchState,
  PlayerId,
  Turn,
} from '../types.js';
import { HUMAN } from '../types.js';
import { categoriesForMode, rosterForMode } from '../../data/modes.js';
import { scoreBuild } from '../scoring/scoring.js';
import { makeRng } from '../rng.js';
import { createPool, removeFromPool, returnToPool, isAvailable } from '../pool/pool.js';
import { initEconomy, canReroll, canFreeze, spendReroll, spendFreeze } from '../economy/economy.js';
import { buildDraftOrder } from '../draft/draftOrder.js';
import { chooseDraftPick } from '../ai/chooseDraftPick.js';
import { FIRST_PICK_HUMAN_PROB } from '../config.js';

/** Begin a fresh match. The seed fully determines the pool order, the draft coin
 *  flip, and the CPU picks. */
export function createMatch(config: MatchConfig): MatchState {
  const rng = makeRng(config.seed);
  const categories = categoriesForMode(config.mode);
  const pool = createPool(
    rng.next,
    rosterForMode(config.mode).map((p) => p.id),
  );
  const seats = draftSeats(config, rng.next);
  const draftOrder = buildDraftOrder(seats, categories);
  const boards: Record<ActorId, Board> = Object.create(null);
  for (const a of config.actors) boards[a] = Object.freeze({});

  return Object.freeze({
    config,
    phase: draftOrder[0]?.actor === 'cpu' ? 'aiThinking' : 'spinning',
    draftOrder: Object.freeze(draftOrder),
    cursor: 0,
    boards: Object.freeze(boards),
    pool,
    economy: initEconomy(),
    frozen: false,
    rngState: rng.state(),
    reveal: null,
  });
}

/** Seat order for the draft. vs-CPU does a one-time weighted coin flip (seeded)
 *  so whoever wins the toss picks first every round; everything else keeps the
 *  configured actor order. */
function draftSeats(config: MatchConfig, rng: () => number): readonly ActorId[] {
  if (config.policy && config.actors.length === 2 && config.actors.includes('cpu')) {
    const pHuman = FIRST_PICK_HUMAN_PROB[config.policy.difficulty];
    return rng() < pHuman ? ['human', 'cpu'] : ['cpu', 'human'];
  }
  return config.actors;
}

/** The turn (actor + category) currently on the clock, or null once done. */
export function currentTurn(state: MatchState): Turn | null {
  return state.draftOrder[state.cursor] ?? null;
}

/** The actor currently on the clock, or null once done. */
export function currentActor(state: MatchState): ActorId | null {
  return currentTurn(state)?.actor ?? null;
}

/** Who picks first this match (won the coin flip), or null if there's no draft. */
export function firstPicker(state: MatchState): ActorId | null {
  return state.draftOrder[0]?.actor ?? null;
}

/** The category currently being drafted, or null once done. */
export function currentCategory(state: MatchState): Category | null {
  const turn = currentTurn(state);
  if (!turn) return null;
  return categoriesForMode(state.config.mode).find((c) => c.id === turn.categoryId) ?? null;
}

/** Commit `playerId` to the current actor's board and drain the pool. The turn
 *  does NOT advance — `reveal` is set so the pick can be shown. No-op if there's
 *  nothing to lock, a reveal is pending, or the player is already drained. */
export function lockPick(state: MatchState, playerId: PlayerId): MatchState {
  const turn = currentTurn(state);
  if (!turn || state.reveal || state.phase !== 'spinning') return state;
  if (turn.actor === 'cpu') return state; // CPU picks go through resolveAITurn only
  if (!isAvailable(state.pool, playerId)) return state;
  return commit(state, turn, playerId, state.rngState);
}

/** Resolve the CPU's turn: choose a pick via the policy, then commit it. Pure +
 *  deterministic (consumes the match PRNG). No-op outside an aiThinking CPU turn. */
export function resolveAITurn(state: MatchState): MatchState {
  if (state.phase !== 'aiThinking' || !state.config.policy) return state;
  const turn = currentTurn(state);
  if (!turn || turn.actor !== 'cpu') return state;
  const rng = makeRng(state.rngState);
  const pick = chooseDraftPick(state, state.config.policy, rng.next);
  return commit(state, turn, pick, rng.state());
}

/** Shared commit: write the pick, drain the pool, enter reveal. */
function commit(state: MatchState, turn: Turn, playerId: PlayerId, rngState: number): MatchState {
  const board = state.boards[turn.actor] ?? {};
  return Object.freeze({
    ...state,
    phase: 'reveal',
    boards: Object.freeze({
      ...state.boards,
      [turn.actor]: Object.freeze({ ...board, [turn.categoryId]: playerId }),
    }),
    pool: removeFromPool(state.pool, playerId),
    reveal: Object.freeze({ actor: turn.actor, categoryId: turn.categoryId, playerId }),
    rngState,
  });
}

/** Finish the reveal and advance to the next turn (or to the result). */
export function advanceAfterReveal(state: MatchState): MatchState {
  if (!state.reveal) return state;
  const nextCursor = state.cursor + 1;
  const done = nextCursor >= state.draftOrder.length;
  const next = state.draftOrder[nextCursor];
  return Object.freeze({
    ...state,
    phase: done ? 'result' : next?.actor === 'cpu' ? 'aiThinking' : 'spinning',
    cursor: nextCursor,
    frozen: false, // a spent Freeze only lasts its round
    reveal: null,
  });
}

/** Spend a Reroll to UNDO the just-locked human pick and re-spin that slot: the
 *  player returns to the pool and the turn goes back to spinning. No-op unless a
 *  reroll is available and a human pick is on the reveal screen. */
export function useReroll(state: MatchState): MatchState {
  if (state.phase !== 'reveal' || !state.reveal) return state;
  const { actor, categoryId, playerId } = state.reveal;
  if (actor === 'cpu') return state; // CPU picks cannot be undone
  if (!canReroll(state.economy)) return state;
  const board: Record<string, PlayerId> = { ...state.boards[actor] };
  delete board[categoryId];
  return Object.freeze({
    ...state,
    phase: 'spinning',
    boards: Object.freeze({ ...state.boards, [actor]: Object.freeze(board) }),
    pool: returnToPool(state.pool, playerId),
    economy: spendReroll(state.economy),
    reveal: null,
  });
}

/** Spend a Freeze: slow the current round's reel. No-op unless available, the
 *  round isn't already frozen, and a human reel is live. */
export function useFreeze(state: MatchState): MatchState {
  if (state.phase !== 'spinning' || state.reveal || state.frozen || !canFreeze(state.economy)) {
    return state;
  }
  return Object.freeze({ ...state, economy: spendFreeze(state.economy), frozen: true });
}

/** True once every turn is taken. */
export function isComplete(state: MatchState): boolean {
  return state.phase === 'result';
}

/** Score one actor's completed build. Throws before the match is done. */
export function matchResult(state: MatchState, actor: ActorId = HUMAN): BuildResult {
  if (state.phase !== 'result') throw new Error('matchResult: match is not complete');
  const board = state.boards[actor];
  if (!board) throw new Error(`matchResult: no board for actor '${actor}'`);
  return scoreBuild(board, state.config.mode);
}

/** The winning actor, 'tie', or null if the match isn't finished. */
export function matchWinner(state: MatchState): ActorId | 'tie' | null {
  if (state.phase !== 'result') return null;
  let best: ActorId | null = null;
  let bestScore = -1;
  let tie = false;
  for (const a of state.config.actors) {
    const overall = matchResult(state, a).overall;
    if (overall > bestScore) {
      bestScore = overall;
      best = a;
      tie = false;
    } else if (overall === bestScore) {
      tie = true;
    }
  }
  return tie ? 'tie' : best;
}
