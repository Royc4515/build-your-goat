// M0 smoke test: proves the Vitest toolchain runs and can import game modules.
// (The real seeded-RNG reproducibility tests arrive with engine/rng.ts in M1.)
import { describe, it, expect } from 'vitest';
import { shuffle, pickOne } from './random.js';

describe('random (smoke)', () => {
  it('shuffle preserves length and membership', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('shuffle does not mutate its input', () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it('pickOne returns an element from the array', () => {
    const input = ['a', 'b', 'c'];
    expect(input).toContain(pickOne(input));
  });

  it('pickOne throws on an empty array', () => {
    expect(() => pickOne([])).toThrow();
  });
});
