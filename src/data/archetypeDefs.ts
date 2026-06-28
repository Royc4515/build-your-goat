// Tunable definitions for the archetype/synergy scoring layer (M4).
//
// Design: every player has a *signature role* — the category they rate highest
// in. A strong build wants ROLE DIVERSITY (a real team has a scorer, a creator,
// an anchor…), so role coverage and themed combos grant multipliers, while roles
// no one covers cap the ceiling. This is data-driven and sport-agnostic — no
// per-player tagging needed.

/** Multiplier tiers by how many distinct signature-roles the build covers,
 *  expressed as a shortfall from full coverage (0 = every role covered). */
export interface DiversityTier {
  readonly maxShortfall: number; // applies when (totalRoles - rolesCovered) <= this
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly multiplier: number;
}

export const DIVERSITY_TIERS: readonly DiversityTier[] = Object.freeze([
  { maxShortfall: 0, id: 'complete-squad', label: 'Complete Squad', icon: '🌐', multiplier: 1.08 },
  { maxShortfall: 1, id: 'versatile', label: 'Versatile Core', icon: '🔀', multiplier: 1.05 },
  { maxShortfall: 2, id: 'balanced', label: 'Balanced Unit', icon: '⚖️', multiplier: 1.02 },
]);

/** Themed synergies on shared traits (replaces the old flat chemistry bonus). */
export const FRANCHISE_CORE = Object.freeze({
  id: 'franchise-core',
  label: 'Franchise Core',
  icon: '🏟️',
  minSameTeam: 3,
  multiplier: 1.03,
});

export const DYNASTY_ERA = Object.freeze({
  id: 'dynasty-era',
  label: 'Dynasty Era',
  icon: '⏳',
  minSameEra: 4,
  multiplier: 1.04,
});

/** Each role left uncovered drops the overall cap by this much... */
export const EMPTY_ROLE_PENALTY = 2;
/** ...but never below this floor. */
export const MIN_CAP = 82;
/** Overall is always capped at the game's classic ceiling. */
export const MAX_OVERALL = 99;
