import { describe, it, expect } from 'vitest';
import { chooseDraftPick } from './chooseDraftPick.js';
import { createMatch, currentTurn, lockPick, advanceAfterReveal } from '../match/match.js';
import { makeRng } from '../rng.js';
import { categoriesForMode, playerForMode, rosterForMode } from '../../data/modes.js';
import type { AIPolicy, MatchConfig } from '../types.js';

const vsAI: MatchConfig = {
  kind: 'vsAI',
  mode: 'nba-legends',
  seed: 7,
  actors: ['human', 'cpu'],
  policy: { difficulty: 'pro', wValue: 1, wDenial: 0.4, wNeed: 0.5, noise: 0.2 },
};

const pureValue: AIPolicy = { difficulty: 'rookie', wValue: 1, wDenial: 0, wNeed: 0, noise: 0 };

/** Advance a fresh vsAI match to the cpu's first turn. */
function atCpuTurn() {
  const m0 = createMatch(vsAI);
  const m1 = advanceAfterReveal(lockPick(m0, m0.pool.available[0]!));
  return m1; // cursor now on cpu
}

describe('chooseDraftPick', () => {
  it('always returns an available player', () => {
    const m = atCpuTurn();
    const pick = chooseDraftPick(m, vsAI.policy!, makeRng(m.rngState).next);
    expect(m.pool.available).toContain(pick);
  });

  it('with pure-value weights, picks the best-rated available player for the open category', () => {
    const m = atCpuTurn();
    const cat = currentTurn(m)!.categoryId;
    const pick = chooseDraftPick(m, pureValue, makeRng(m.rngState).next);

    const best = [...m.pool.available]
      .map((id) => playerForMode('nba-legends', id))
      .reduce((a, b) => (b.attrs[cat]! > a.attrs[cat]! ? b : a));
    expect(playerForMode('nba-legends', pick).attrs[cat]).toBe(best.attrs[cat]);
  });

  it('is deterministic for a given rng state', () => {
    const m = atCpuTurn();
    const a = chooseDraftPick(m, vsAI.policy!, makeRng(m.rngState).next);
    const b = chooseDraftPick(m, vsAI.policy!, makeRng(m.rngState).next);
    expect(a).toBe(b);
  });

  it('never picks a player already drained from the pool', () => {
    const m = atCpuTurn();
    const pick = chooseDraftPick(m, vsAI.policy!, makeRng(m.rngState).next);
    // the human already took available[0] of the original pool; ensure cpu can't
    const humanPick = Object.values(m.boards.human!)[0];
    expect(pick).not.toBe(humanPick);
    expect(rosterForMode('nba-legends').map((p) => p.id)).toContain(pick);
  });

  it('categories exist for the mode (sanity)', () => {
    expect(categoriesForMode('nba-legends')).toHaveLength(6);
  });
});
