// The CPU "GM" pick: a readable weighted valuation over the still-available pool
// for the open category. Pure and deterministic given the injected rng.
//
//   score = wValue * rating-in-open-slot
//         + wDenial * how-much-the-human-wants-this-player-next
//         + wNeed   * fills-an-empty-role-on-the-CPU-board
//         + noise   * rng()
//
// rng() is consumed once per candidate so the choice is reproducible from the
// match seed regardless of difficulty. NOTE: noise is assigned by pool-iteration
// position, so a human Reroll (which reshuffles pool.available) shifts which
// candidate gets which noise sample — intentional, and still fully deterministic
// given the match history.

import type { AIPolicy, CategoryId, MatchState, PlayerId } from '../types.js';
import type { Rng } from '../rng.js';
import { categoriesForMode, playerForMode } from '../../data/modes.js';
import { primaryRole } from '../archetypes/archetypes.js';

export function chooseDraftPick(state: MatchState, policy: AIPolicy, rng: Rng): PlayerId {
  const turn = state.draftOrder[state.cursor];
  if (!turn) throw new Error('chooseDraftPick: no current turn');
  const mode = state.config.mode;
  const categories = categoriesForMode(mode);

  const cpuBoard = state.boards[turn.actor] ?? {};
  const coveredRoles = new Set<CategoryId>(
    Object.values(cpuBoard).map((pid) => primaryRole(playerForMode(mode, pid), categories)),
  );
  const humanNext = nextOpponentCategory(state, turn.actor);

  let bestId: PlayerId | undefined;
  let bestScore = -Infinity;
  for (const id of state.pool.available) {
    const p = playerForMode(mode, id);
    const value = (p.attrs[turn.categoryId] ?? 0) / 99;
    const denial = humanNext ? (p.attrs[humanNext] ?? 0) / 99 : 0;
    const need = coveredRoles.has(primaryRole(p, categories)) ? 0 : 1;
    const score =
      policy.wValue * value +
      policy.wDenial * denial +
      policy.wNeed * need +
      policy.noise * rng();
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  if (bestId === undefined) throw new Error('chooseDraftPick: pool is empty');
  return bestId;
}

/** The category the next non-CPU actor will pick — the CPU's denial target. */
function nextOpponentCategory(state: MatchState, cpuActor: string): CategoryId | null {
  for (let i = state.cursor + 1; i < state.draftOrder.length; i++) {
    const t = state.draftOrder[i];
    if (t && t.actor !== cpuActor) return t.categoryId;
  }
  return null;
}
