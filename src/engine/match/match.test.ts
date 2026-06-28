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
  it('is deterministic: same seed -> same reel order', () => {
    expect(createMatch(solo(123)).order).toEqual(createMatch(solo(123)).order);
  });

  it('different seeds -> different order', () => {
    expect(createMatch(solo(1)).order).not.toEqual(createMatch(solo(2)).order);
  });

  it('order is a permutation of the full roster', () => {
    const m = createMatch(solo(7));
    const rosterIds = rosterForMode('nba-legends').map((p) => p.id);
    expect([...m.order].sort()).toEqual([...rosterIds].sort());
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
  it('lockPick records the pick and enters reveal (immutably)', () => {
    const m0 = createMatch(solo(7));
    const cat = currentCategory(m0)!;
    const m1 = lockPick(m0, 'jordan');

    expect(m1).not.toBe(m0);
    expect(m0.reveal).toBeNull(); // original untouched
    expect(m1.phase).toBe('reveal');
    expect(m1.reveal).toEqual({ categoryId: cat.id, playerId: 'jordan' });
    expect(m1.picks[cat.id]).toBe('jordan');
  });

  it('a second lock during reveal is a no-op', () => {
    const m1 = lockPick(createMatch(solo(7)), 'jordan');
    expect(lockPick(m1, 'lebron')).toBe(m1);
  });

  it('advanceAfterReveal without a reveal is a no-op', () => {
    const m0 = createMatch(solo(7));
    expect(advanceAfterReveal(m0)).toBe(m0);
  });

  it('plays a full solo build to a scored result', () => {
    const categories = categoriesForMode('nba-legends');
    let m = createMatch(solo(7));
    for (let i = 0; i < categories.length; i++) {
      expect(currentCategory(m)?.id).toBe(categories[i]!.id);
      m = lockPick(m, 'jordan');
      m = advanceAfterReveal(m);
    }
    expect(isComplete(m)).toBe(true);
    expect(currentCategory(m)).toBeNull();

    const result = matchResult(m);
    expect(result.slots).toHaveLength(categories.length);
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(99);
  });
});
