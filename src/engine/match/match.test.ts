import { describe, it, expect } from 'vitest';
import {
  createMatch,
  currentTurn,
  currentActor,
  currentCategory,
  lockPick,
  advanceAfterReveal,
  resolveAITurn,
  isComplete,
  matchResult,
  matchWinner,
  useReroll,
  useFreeze,
} from './match.js';
import { categoriesForMode, rosterForMode } from '../../data/modes.js';
import { policyFor } from '../ai/policy.js';
import type { MatchConfig } from '../types.js';

const solo = (seed: number): MatchConfig => ({
  kind: 'solo',
  mode: 'nba-legends',
  seed,
  actors: ['human'],
});
const vsAI = (seed: number, diff: 'rookie' | 'pro' | 'allstar' = 'pro'): MatchConfig => ({
  kind: 'vsAI',
  mode: 'nba-legends',
  seed,
  actors: ['human', 'cpu'],
  policy: policyFor(diff),
});

describe('createMatch (solo)', () => {
  it('one human actor, 6 turns, empty board, spinning', () => {
    const m = createMatch(solo(7));
    expect(m.config.actors).toEqual(['human']);
    expect(m.draftOrder).toHaveLength(6);
    expect(m.draftOrder.every((t) => t.actor === 'human')).toBe(true);
    expect(m.boards.human).toEqual({});
    expect(m.phase).toBe('spinning');
  });

  it('pool order is deterministic and a full-roster permutation', () => {
    expect(createMatch(solo(123)).pool.order).toEqual(createMatch(solo(123)).pool.order);
    const rosterIds = rosterForMode('nba-legends').map((p) => p.id);
    expect([...createMatch(solo(7)).pool.order].sort()).toEqual([...rosterIds].sort());
  });
});

describe('solo transitions', () => {
  it('lockPick writes the human board, drains the pool, enters reveal', () => {
    const m0 = createMatch(solo(7));
    const cat = currentCategory(m0)!;
    const m1 = lockPick(m0, 'jordan');
    expect(m1.reveal).toEqual({ actor: 'human', categoryId: cat.id, playerId: 'jordan' });
    expect(m1.boards.human[cat.id]).toBe('jordan');
    expect(m1.pool.available).not.toContain('jordan');
    expect(m0.boards.human).toEqual({}); // original untouched
  });

  it('plays a full solo build of distinct players to a scored result', () => {
    const categories = categoriesForMode('nba-legends');
    let m = createMatch(solo(7));
    const picked: string[] = [];
    for (let i = 0; i < categories.length; i++) {
      const id = m.pool.available[0]!;
      picked.push(id);
      m = advanceAfterReveal(lockPick(m, id));
    }
    expect(isComplete(m)).toBe(true);
    expect(new Set(picked).size).toBe(categories.length);
    expect(matchResult(m).slots).toHaveLength(categories.length);
  });
});

describe('economy', () => {
  it('reroll undoes the just-locked pick, returns it to the pool, re-spins', () => {
    const m0 = createMatch(solo(7));
    const cat = currentCategory(m0)!;
    const id = m0.pool.available[0]!;
    const locked = lockPick(m0, id);
    expect(locked.phase).toBe('reveal');
    expect(locked.boards.human![cat.id]).toBe(id);

    const undone = useReroll(locked);
    expect(undone.phase).toBe('spinning');
    expect(undone.reveal).toBeNull();
    expect(undone.economy.rerolls).toBe(2);
    expect(undone.cursor).toBe(0); // same slot again
    expect(undone.boards.human![cat.id]).toBeUndefined(); // pick removed
    expect(undone.pool.available).toContain(id); // returned to the pool
  });

  it('reroll is a no-op while spinning (nothing to undo) and when none are left', () => {
    const m0 = createMatch(solo(7));
    expect(useReroll(m0)).toBe(m0); // spinning, no reveal
    let spent = m0;
    for (let i = 0; i < 5; i++) spent = useReroll(lockPick(spent, spent.pool.available[0]!));
    expect(spent.economy.rerolls).toBe(0);
    expect(useReroll(lockPick(spent, spent.pool.available[0]!)).economy.rerolls).toBe(0);
  });

  it('freeze slows the round and clears after advancing', () => {
    const m0 = createMatch(solo(7));
    const f = useFreeze(m0);
    expect(f.frozen).toBe(true);
    expect(f.economy.freezes).toBe(1);
    const next = advanceAfterReveal(lockPick(f, f.pool.available[0]!));
    expect(next.frozen).toBe(false);
  });
});

describe('vsAI coin-flip draft', () => {
  it('12 turns in a consistent seat order (no snake reversal)', () => {
    const m = createMatch(vsAI(7));
    expect(m.draftOrder).toHaveLength(12);
    const seats = m.draftOrder.map((t) => t.actor);
    const [a, b] = [seats[0], seats[1]];
    expect(a).not.toBe(b);
    for (let i = 0; i < 12; i++) expect(seats[i]).toBe(i % 2 === 0 ? a : b);
  });

  it('the coin flip is deterministic for a given seed', () => {
    expect(createMatch(vsAI(7)).draftOrder[0]!.actor).toBe(createMatch(vsAI(7)).draftOrder[0]!.actor);
  });

  it('difficulty weights who picks first (rookie favors human, allstar favors cpu)', () => {
    const humanFirst = (diff: 'rookie' | 'pro' | 'allstar') => {
      let n = 0;
      for (let s = 0; s < 300; s++) if (createMatch(vsAI(s, diff)).draftOrder[0]!.actor === 'human') n++;
      return n;
    };
    const rookie = humanFirst('rookie');
    const allstar = humanFirst('allstar');
    expect(rookie).toBeGreaterThan(allstar);
    expect(rookie).toBeGreaterThan(150); // ~0.67 * 300
    expect(allstar).toBeLessThan(150); // ~0.33 * 300
  });

  it('resolveAITurn is deterministic and only picks available players', () => {
    let m = createMatch(vsAI(7));
    let guard = 0;
    while (m.phase !== 'aiThinking' && guard++ < 6) {
      if (m.phase === 'spinning') m = advanceAfterReveal(lockPick(m, m.pool.available[0]!));
    }
    expect(m.phase).toBe('aiThinking');
    const a = resolveAITurn(m);
    const b = resolveAITurn(m);
    expect(a.reveal).toEqual(b.reveal); // deterministic
    expect(a.reveal!.actor).toBe('cpu');
    expect(m.pool.available).toContain(a.reveal!.playerId); // was available
    expect(a.pool.available).not.toContain(a.reveal!.playerId); // now drained
  });

  it('plays a full vsAI match to two scored boards with a winner', () => {
    let m = createMatch(vsAI(7, 'allstar'));
    let guard = 0;
    while (!isComplete(m) && guard++ < 50) {
      if (m.phase === 'aiThinking') {
        m = advanceAfterReveal(resolveAITurn(m));
      } else if (m.phase === 'spinning') {
        m = advanceAfterReveal(lockPick(m, m.pool.available[0]!));
      } else {
        m = advanceAfterReveal(m);
      }
    }
    expect(isComplete(m)).toBe(true);
    expect(Object.keys(matchResult(m, 'human').slots)).toBeTruthy();
    expect(matchResult(m, 'cpu').slots).toHaveLength(6);
    expect(['human', 'cpu', 'tie']).toContain(matchWinner(m));
    // no player appears on both boards (shared draining pool)
    const used = [...Object.values(m.boards.human!), ...Object.values(m.boards.cpu!)];
    expect(new Set(used).size).toBe(used.length);
  });
});
