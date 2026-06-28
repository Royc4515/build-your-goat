import { describe, it, expect } from 'vitest';
import { evaluateSynergies } from './synergy.js';
import { primaryRole, rolesCovered } from './archetypes.js';
import type { Category, Player } from '../types.js';

const cats: Category[] = [
  { id: 'a', label: 'A', icon: '', tagline: '', accent: '' },
  { id: 'b', label: 'B', icon: '', tagline: '', accent: '' },
  { id: 'c', label: 'C', icon: '', tagline: '', accent: '' },
];

function mk(id: string, attrs: Record<string, number>, team = id, era = id): Player {
  return {
    id, name: id, short: id, monogram: id, number: 0, team, era,
    colors: ['#000', '#fff'], attrs, nbaId: null,
  };
}

describe('primaryRole', () => {
  it('picks the highest-rated category; ties break by category order', () => {
    expect(primaryRole(mk('x', { a: 90, b: 10, c: 10 }), cats)).toBe('a');
    expect(primaryRole(mk('y', { a: 50, b: 50, c: 10 }), cats)).toBe('a'); // tie a/b -> a
    expect(primaryRole(mk('z', { a: 10, b: 10, c: 90 }), cats)).toBe('c');
  });
});

describe('evaluateSynergies', () => {
  it('full role coverage fires the complete-squad tier with no empty roles', () => {
    const players = [
      mk('p1', { a: 90, b: 10, c: 10 }),
      mk('p2', { a: 10, b: 90, c: 10 }),
      mk('p3', { a: 10, b: 10, c: 90 }),
    ];
    const r = evaluateSynergies(players, cats);
    expect(rolesCovered(players, cats).size).toBe(3);
    expect(r.emptyRoles).toEqual([]);
    expect(r.cap).toBe(99);
    expect(r.completed.map((s) => s.id)).toContain('complete-squad');
    expect(r.multiplier).toBeGreaterThan(1);
  });

  it('stacking one role leaves empty roles and lowers the cap', () => {
    const players = [
      mk('p1', { a: 90, b: 10, c: 10 }),
      mk('p2', { a: 88, b: 10, c: 10 }),
      mk('p3', { a: 80, b: 10, c: 10 }),
    ];
    const r = evaluateSynergies(players, cats);
    expect(r.rolesCovered).toBe(1);
    expect([...r.emptyRoles].sort()).toEqual(['b', 'c']);
    expect(r.cap).toBe(99 - 2 * 2); // two empty roles
  });

  it('franchise core fires when 3+ share a team', () => {
    const players = [
      mk('p1', { a: 90, b: 10, c: 10 }, 'LAL'),
      mk('p2', { a: 10, b: 90, c: 10 }, 'LAL'),
      mk('p3', { a: 10, b: 10, c: 90 }, 'LAL'),
    ];
    const r = evaluateSynergies(players, cats);
    expect(r.completed.map((s) => s.id)).toContain('franchise-core');
  });
});
