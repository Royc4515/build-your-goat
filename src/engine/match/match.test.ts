import { describe, it, expect } from 'vitest';
import {
  createMatch,
  currentCategory,
  lockPick,
  advanceAfterReveal,
  isComplete,
  matchResult,
} from './match.js';
import { categoriesForMode, rosterForMode } from '../../data/modes.js';
import type { MatchConfig } from '../types.js';

const solo = (seed: number): MatchConfig => ({ kind: 'solo', mode: 'nba-legends', seed });

describe('createMatch', () => {
  it('is deterministic: same seed -> same pool order', () => {
    expect(createMatch(solo(123)).pool.order).toEqual(createMatch(solo(123)).pool.order);
  });

  it('different seeds -> different order', () => {
    expect(createMatch(solo(1)).pool.order).not.toEqual(createMatch(solo(2)).pool.order);
  });

  it('pool order is a permutation of the full roster; available starts full', () => {
    const m = createMatch(solo(7));
    const rosterIds = rosterForMode('nba-legends').map((p) => p.id);
    expect([...m.pool.order].sort()).toEqual([...rosterIds].sort());
    expect(m.pool.available).toEqual(m.pool.order);
  });

  it('starts spinning at round 0 with no picks', () => {
    const m = createMatch(solo(7));
    expect(m.phase).toBe('spinning');
    expect(m.round).toBe(0);
    expect(Object.keys(m.picks)).toHaveLength(0);
    expect(m.reveal).toBeNull();
  });
});

describe('lock / advance transitions', () => {
  it('lockPick records the pick, drains the pool, and enters reveal (immutably)', () => {
    const m0 = createMatch(solo(7));
    const cat = currentCategory(m0)!;
    const m1 = lockPick(m0, 'jordan');

    expect(m1).not.toBe(m0);
    expect(m0.reveal).toBeNull(); // original untouched
    expect(m0.pool.available).toContain('jordan'); // original pool untouched
    expect(m1.phase).toBe('reveal');
    expect(m1.reveal).toEqual({ categoryId: cat.id, playerId: 'jordan' });
    expect(m1.picks[cat.id]).toBe('jordan');
    expect(m1.pool.available).not.toContain('jordan'); // drained
    expect(m1.pool.available).toHaveLength(m0.pool.available.length - 1);
  });

  it('a second lock during reveal is a no-op', () => {
    const m1 = lockPick(createMatch(solo(7)), 'jordan');
    expect(lockPick(m1, 'lebron')).toBe(m1);
  });

  it('locking a player not in the pool is a no-op', () => {
    const m0 = createMatch(solo(7));
    expect(lockPick(m0, 'nobody-such-id')).toBe(m0);
  });

  it('cannot re-pick a drained player in a later round', () => {
    let m = lockPick(createMatch(solo(7)), 'jordan');
    m = advanceAfterReveal(m); // round 1, spinning
    expect(m.reveal).toBeNull();
    const blocked = lockPick(m, 'jordan'); // already drained
    expect(blocked).toBe(m);
  });

  it('advanceAfterReveal without a reveal is a no-op', () => {
    const m0 = createMatch(solo(7));
    expect(advanceAfterReveal(m0)).toBe(m0);
  });

  it('plays a full solo build of distinct players to a scored result', () => {
    const categories = categoriesForMode('nba-legends');
    let m = createMatch(solo(7));
    const picked: string[] = [];
    for (let i = 0; i < categories.length; i++) {
      expect(currentCategory(m)?.id).toBe(categories[i]!.id);
      const next = m.pool.available[0]!; // always available, always distinct (drains)
      picked.push(next);
      m = lockPick(m, next);
      m = advanceAfterReveal(m);
    }
    expect(isComplete(m)).toBe(true);
    expect(currentCategory(m)).toBeNull();
    expect(new Set(picked).size).toBe(categories.length); // all distinct
    expect(m.pool.available).toHaveLength(m.pool.order.length - categories.length);

    const result = matchResult(m);
    expect(result.slots).toHaveLength(categories.length);
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(99);
  });
});
