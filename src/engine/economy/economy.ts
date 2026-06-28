// Pure helpers over the power-up economy. Spending is immutable; the match-level
// effects (reshuffling the pool on reroll, slowing the reel on freeze) live in
// engine/match because they also touch the pool / reel state.

import type { EconomyState } from '../types.js';
import { START_ECONOMY } from '../config.js';

export function initEconomy(start: EconomyState = START_ECONOMY): EconomyState {
  return Object.freeze({ rerolls: start.rerolls, freezes: start.freezes });
}

export function canReroll(e: EconomyState): boolean {
  return e.rerolls > 0;
}

export function canFreeze(e: EconomyState): boolean {
  return e.freezes > 0;
}

export function spendReroll(e: EconomyState): EconomyState {
  return Object.freeze({ ...e, rerolls: Math.max(0, e.rerolls - 1) });
}

export function spendFreeze(e: EconomyState): EconomyState {
  return Object.freeze({ ...e, freezes: Math.max(0, e.freezes - 1) });
}
