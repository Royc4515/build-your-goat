// Snake (serpentine) draft order. Both actors fill every category; within each
// category they pick in turn, and the seat order reverses every round — so the
// first-pick advantage (and the chance to deny the category leader) alternates.
//
// Solo collapses to a single actor picking each category in order.

import type { ActorId, Category, Turn } from '../types.js';

export function snakeDraftOrder(
  actors: readonly ActorId[],
  categories: readonly Category[],
): Turn[] {
  const order: Turn[] = [];
  categories.forEach((c, round) => {
    const seats = round % 2 === 0 ? actors : [...actors].reverse();
    for (const actor of seats) {
      order.push({ actor, categoryId: c.id, round });
    }
  });
  return order;
}
