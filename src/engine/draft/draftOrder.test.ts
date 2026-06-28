import { describe, it, expect } from 'vitest';
import { buildDraftOrder } from './draftOrder.js';
import type { Category } from '../types.js';

const cat = (id: string): Category => ({ id, label: id, icon: '', tagline: '', accent: '' });
const cats = [cat('a'), cat('b'), cat('c')];

describe('buildDraftOrder', () => {
  it('solo: one actor picks each category in order', () => {
    expect(buildDraftOrder(['human'], cats)).toEqual([
      { actor: 'human', categoryId: 'a', round: 0 },
      { actor: 'human', categoryId: 'b', round: 1 },
      { actor: 'human', categoryId: 'c', round: 2 },
    ]);
  });

  it('two actors: seat order is consistent every round (no snake reversal)', () => {
    const order = buildDraftOrder(['human', 'cpu'], cats);
    expect(order.map((t) => `${t.actor}@${t.categoryId}`)).toEqual([
      'human@a',
      'cpu@a',
      'human@b',
      'cpu@b',
      'human@c',
      'cpu@c',
    ]);
  });

  it('seat order can be flipped (cpu first) and stays consistent', () => {
    const order = buildDraftOrder(['cpu', 'human'], cats);
    expect(order.map((t) => t.actor)).toEqual(['cpu', 'human', 'cpu', 'human', 'cpu', 'human']);
  });

  it('every actor fills every category exactly once', () => {
    const order = buildDraftOrder(['human', 'cpu'], cats);
    for (const actor of ['human', 'cpu']) {
      const theirs = order.filter((t) => t.actor === actor).map((t) => t.categoryId);
      expect([...theirs].sort()).toEqual(['a', 'b', 'c']);
    }
  });
});
