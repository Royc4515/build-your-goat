// Earned flair shown on the result card. Derived from the fired synergies and
// the per-slot scores. Pure.

import type { CompletedSynergy, ScoredSlot } from '../types.js';

export function badgesFor(
  completed: readonly CompletedSynergy[],
  slots: readonly ScoredSlot[],
): string[] {
  const badges = completed.map((s) => `${s.icon} ${s.label}`);
  if (slots.length > 0 && slots.every((s) => s.score >= 90)) badges.push('💯 No Weak Links');
  return badges;
}
