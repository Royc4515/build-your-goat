import { describe, it, expect } from 'vitest';
import { initEconomy, canReroll, canFreeze, spendReroll, spendFreeze } from './economy.js';

describe('economy', () => {
  it('initEconomy uses provided start values', () => {
    expect(initEconomy({ rerolls: 5, freezes: 1 })).toEqual({ rerolls: 5, freezes: 1 });
  });

  it('can* reflect remaining counts', () => {
    expect(canReroll({ rerolls: 1, freezes: 0 })).toBe(true);
    expect(canReroll({ rerolls: 0, freezes: 0 })).toBe(false);
    expect(canFreeze({ rerolls: 0, freezes: 2 })).toBe(true);
    expect(canFreeze({ rerolls: 0, freezes: 0 })).toBe(false);
  });

  it('spend* decrement immutably and never go below zero', () => {
    const e = initEconomy({ rerolls: 1, freezes: 1 });
    const r = spendReroll(e);
    expect(r).not.toBe(e);
    expect(e.rerolls).toBe(1); // original untouched
    expect(r.rerolls).toBe(0);
    expect(spendReroll(r).rerolls).toBe(0); // floored

    expect(spendFreeze(e).freezes).toBe(0);
    expect(spendFreeze({ rerolls: 0, freezes: 0 }).freezes).toBe(0);
  });
});
