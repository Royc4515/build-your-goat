// Tunable engine constants in one place. Pure data — no logic, no side effects.

import type { EconomyState } from './types.js';

/** Starting power-ups per match (use-it-or-lose-it; they do not carry over). */
export const START_ECONOMY: EconomyState = Object.freeze({ rerolls: 3, freezes: 2 });

/** How much a spent Freeze slows the reel for the round (cadence multiplier). */
export const FREEZE_SLOWDOWN = 2.6;
