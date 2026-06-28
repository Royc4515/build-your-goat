// CPU "GM" difficulty presets. Each is a set of weights for the linear pick
// valuation in chooseDraftPick: value (raw rating in the open slot), denial (how
// much the human wants this player next), need (fills the CPU's own empty role),
// and noise (exploration — higher = more beatable).

import type { AIPolicy, Difficulty } from '../types.js';

export const POLICIES: Readonly<Record<Difficulty, AIPolicy>> = Object.freeze({
  rookie: { difficulty: 'rookie', wValue: 1.0, wDenial: 0.0, wNeed: 0.2, noise: 0.5 },
  pro: { difficulty: 'pro', wValue: 1.0, wDenial: 0.4, wNeed: 0.5, noise: 0.18 },
  allstar: { difficulty: 'allstar', wValue: 1.0, wDenial: 0.8, wNeed: 0.7, noise: 0.04 },
});

export function policyFor(difficulty: Difficulty): AIPolicy {
  return POLICIES[difficulty];
}
