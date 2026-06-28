// Tunable engine constants in one place. Pure data — no logic, no side effects.

import type { Difficulty, EconomyState } from './types.js';

/**
 * Probability the HUMAN wins the one-time draft coin flip (and thus picks first
 * every round) in a vs-CPU match, by difficulty. Picking first is an advantage
 * (first dibs on each category), so easier = more likely to lead.
 */
export const FIRST_PICK_HUMAN_PROB: Readonly<Record<Difficulty, number>> = Object.freeze({
  rookie: 0.67,
  pro: 0.5,
  allstar: 0.33,
});

/** Starting power-ups per match (use-it-or-lose-it; they do not carry over). */
export const START_ECONOMY: EconomyState = Object.freeze({ rerolls: 3, freezes: 2 });

/** How much a spent Freeze slows the reel for the round (cadence multiplier). */
export const FREEZE_SLOWDOWN = 2.6;
