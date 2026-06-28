// Archetype derivation: a player's *signature role* is the category they rate
// highest in. Pure and sport-agnostic — works off whatever category set the mode
// uses, with no per-player tagging.

import type { Category, CategoryId, Player } from '../types.js';

/** The category id a player rates highest in (ties broken by category order). */
export function primaryRole(player: Player, categories: readonly Category[]): CategoryId {
  let bestId = categories[0]!.id;
  let bestVal = player.attrs[bestId] ?? -Infinity;
  for (const c of categories) {
    const v = player.attrs[c.id] ?? -Infinity;
    if (v > bestVal) {
      bestVal = v;
      bestId = c.id;
    }
  }
  return bestId;
}

/** Distinct signature roles across the picked players. */
export function rolesCovered(players: readonly Player[], categories: readonly Category[]): Set<CategoryId> {
  return new Set(players.map((p) => primaryRole(p, categories)));
}
