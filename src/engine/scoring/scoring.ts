// Pure scoring for a completed GOAT build. Given the picks (categoryId ->
// playerId) it computes per-slot scores, the chemistry bonus, the overall
// rating, tier and badges. No DOM, no side effects.
//
// M1 keeps the original flat chemistry bonus verbatim; M4 replaces it with the
// archetype-synergy multiplier (see the milestone plan).

import type { BuildResult, CategoryId, ModeId, Player, PlayerId, ScoredSlot } from '../types.js';
import { categoriesForMode, playerForMode } from '../../data/modes.js';
import { tierFor } from './tiers.js';
import { badgesFor, maxDuplicateCount, isUniform } from './badges.js';

export function scoreBuild(
  picks: Readonly<Record<CategoryId, PlayerId>>,
  mode: ModeId,
): BuildResult {
  const slots: ScoredSlot[] = categoriesForMode(mode).map((c) => {
    const playerId = picks[c.id];
    if (!playerId) throw new Error(`scoreBuild: missing pick for category '${c.id}'`);
    const player = playerForMode(mode, playerId);
    const score = player.attrs[c.id];
    if (score === undefined) {
      throw new Error(`scoreBuild: player '${playerId}' has no '${c.id}' rating`);
    }
    return { categoryId: c.id, label: c.label, icon: c.icon, accent: c.accent, playerId, score };
  });

  const players = slots.map((s) => playerForMode(mode, s.playerId));
  const base = avg(slots.map((s) => s.score));
  const chemistry = chemistryBonus(players);
  const overall = clamp(Math.round(base + chemistry), 0, 99);

  return {
    slots,
    base: Math.round(base),
    chemistry,
    overall,
    tier: tierFor(overall),
    badges: badgesFor(players, slots),
  };
}

/**
 * Chemistry rewards thematic builds: stacking one player ("one-man army"),
 * leaning on a single team, or a single-era squad. Capped so it tops up a good
 * build rather than dominating it.
 */
function chemistryBonus(players: readonly Player[]): number {
  let bonus = 0;
  bonus += maxDuplicateCount(players.map((p) => p.id)) >= 3 ? 4 : 0; // one-man army
  bonus += maxDuplicateCount(players.map((p) => p.team)) >= 4 ? 2 : 0; // team core
  bonus += isUniform(players.map((p) => p.era)) ? 3 : 0; // same-era squad
  return Math.min(bonus, 6);
}

function avg(nums: readonly number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
