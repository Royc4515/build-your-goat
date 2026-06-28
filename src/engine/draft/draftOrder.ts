// Draft order. Both actors fill every category; within each category they pick
// in a fixed seat order that does NOT change round to round (no snake/reversal).
// A one-time coin flip in createMatch decides the seat order, so whoever wins the
// toss picks first in every category. Solo collapses to a single actor.

import type { ActorId, Category, Turn } from '../types.js';

export function buildDraftOrder(
  seats: readonly ActorId[],
  categories: readonly Category[],
): Turn[] {
  const order: Turn[] = [];
  categories.forEach((c, round) => {
    for (const actor of seats) {
      order.push({ actor, categoryId: c.id, round });
    }
  });
  return order;
}
