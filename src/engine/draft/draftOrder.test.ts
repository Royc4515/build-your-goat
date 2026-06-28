import { describe, it, expect } from 'vitest';
import { snakeDraftOrder } from './draftOrder.js';
import type { Category } from '../types.js';

const cat = (id: string): Category => ({ id, label: id, icon: '', tagline: '', accent: '' });
const cats = [cat('a'), cat('b'), cat('c')];

describe('snakeDraftOrder', () => {
  it('solo: one actor picks each category in order', () => {
    const order = snakeDraftOrder(['human'], cats);
    expect(order).toEqual([
      { actor: 'human', categoryId: 'a', round: 0 },
      { actor: 'human', categoryId: 'b', round: 1 },
      { actor: 'human', categoryId: 'c', round: 2 },
    ]);
  });

  it('two actors: seat order reverses every round (snake)', () => {
    const order = snakeDraftOrder(['human', 'cpu'], cats);
    expect(order.map((t) => `${t.actor}@${t.categoryId}`)).toEqual([
      'human@a',
      'cpu@a',
      'cpu@b',
      'human@b',
      'human@c',
      'cpu@c',
    ]);
  });

  it('every actor fills every category exactly once', () => {
    const order = snakeDraftOrder(['human', 'cpu'], cats);
    for (const actor of ['human', 'cpu']) {
      const theirs = order.filter((t) => t.actor === actor).map((t) => t.categoryId);
      expect([...theirs].sort()).toEqual(['a', 'b', 'c']);
    }
  });
});
