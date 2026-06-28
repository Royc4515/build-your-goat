// Seeded, deterministic pseudo-random number generator (mulberry32).
//
// This is the ONLY source of randomness the engine is allowed to use — never
// `Math.random`. Because the generator is fully determined by its 32-bit seed,
// and its internal counter is serializable via `state()`, a match can store the
// counter inside immutable state and be replayed bit-for-bit. That is what makes
// the daily challenge identical for everyone and the AI reproducible in tests.

/** A pull-based random stream returning floats in [0, 1). */
export type Rng = () => number;

export interface SeededRng {
  /** Draw the next float in [0, 1). Advances the internal counter. */
  readonly next: Rng;
  /** The current internal counter — persist this into immutable state to resume. */
  readonly state: () => number;
}

/**
 * Create a stateful PRNG starting from `seed` (any integer). Pass the value of a
 * previous `state()` back in to resume an identical stream.
 */
export function makeRng(seed: number): SeededRng {
  let a = seed >>> 0;
  const next: Rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, state: () => a >>> 0 };
}

/** Fisher-Yates shuffle into a NEW array (input untouched), driven by `rng`. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Pick one element from a non-empty array using `rng`. */
export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pickOne: cannot pick from an empty array');
  return items[Math.floor(rng() * items.length)]!;
}

/** Random integer in [0, maxExclusive). */
export function nextInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}
