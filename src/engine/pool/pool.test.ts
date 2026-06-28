import { describe, it, expect } from 'vitest';
import { createPool, removeFromPool, returnToPool, poolRemaining, isAvailable } from './pool.js';
import { makeRng } from '../rng.js';

const ids = ['a', 'b', 'c', 'd', 'e'];

describe('pool', () => {
  it('createPool is a seeded permutation; available starts equal to order', () => {
    const p = createPool(makeRng(1).next, ids);
    expect([...p.order].sort()).toEqual([...ids].sort());
    expect(p.available).toEqual(p.order);
    expect(poolRemaining(p)).toBe(ids.length);
  });

  it('createPool is deterministic for a seed', () => {
    expect(createPool(makeRng(9).next, ids).order).toEqual(createPool(makeRng(9).next, ids).order);
  });

  it('removeFromPool drains one and is immutable', () => {
    const p = createPool(makeRng(1).next, ids);
    const p2 = removeFromPool(p, 'c');
    expect(p2).not.toBe(p);
    expect(poolRemaining(p)).toBe(5); // original untouched
    expect(poolRemaining(p2)).toBe(4);
    expect(isAvailable(p2, 'c')).toBe(false);
    expect(p2.order).toBe(p.order); // order reference preserved
  });

  it('removing an absent id is a no-op (same reference)', () => {
    const p = removeFromPool(createPool(makeRng(1).next, ids), 'c');
    expect(removeFromPool(p, 'c')).toBe(p);
    expect(removeFromPool(p, 'zzz')).toBe(p);
  });

  it('returnToPool re-adds a drained id at its order position; no-ops otherwise', () => {
    const p0 = createPool(makeRng(1).next, ids);
    const drained = removeFromPool(p0, 'c');
    const restored = returnToPool(drained, 'c');
    expect(restored.available).toContain('c');
    expect(poolRemaining(restored)).toBe(ids.length);
    // available stays ordered by the fixed pool order
    const rank = (x: string) => p0.order.indexOf(x);
    const sorted = [...restored.available].sort((a, b) => rank(a) - rank(b));
    expect(restored.available).toEqual(sorted);
    // already-present or unknown ids are no-ops (same reference)
    expect(returnToPool(restored, 'c')).toBe(restored);
    expect(returnToPool(restored, 'zzz')).toBe(restored);
  });
});
