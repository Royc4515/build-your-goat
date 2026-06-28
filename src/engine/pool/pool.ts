// The shared draft pool: a seeded permutation of the roster that drains as
// players are locked. Pure + immutable — every mutation returns a new Pool.

import type { Pool, PlayerId } from '../types.js';
import { shuffle, type Rng } from '../rng.js';

/** Build a pool from roster ids, shuffled into the seeded draft order. */
export function createPool(rng: Rng, rosterIds: readonly PlayerId[]): Pool {
  const order = Object.freeze(shuffle(rng, rosterIds));
  return Object.freeze({ order, available: order });
}

/** Remove a player from the available set (a no-op if already gone). */
export function removeFromPool(pool: Pool, id: PlayerId): Pool {
  if (!pool.available.includes(id)) return pool;
  return Object.freeze({
    order: pool.order,
    available: Object.freeze(pool.available.filter((x) => x !== id)),
  });
}

/** How many players are still pickable. */
export function poolRemaining(pool: Pool): number {
  return pool.available.length;
}

/** True if the player can still be drafted. */
export function isAvailable(pool: Pool, id: PlayerId): boolean {
  return pool.available.includes(id);
}
