import { describe, it, expect } from 'vitest';
import { scoreBuild, projectBuild } from './scoring.js';

// nba-legends categories: scoring, playmaking, defense, athleticism, clutch, leadership.

describe('scoreBuild (synergy model)', () => {
  it('a diverse specialist build covers every role and scores 99', () => {
    const picks = {
      scoring: 'jordan', // signature: scoring
      playmaking: 'magic', // playmaking
      defense: 'russell', // defense
      athleticism: 'lebron', // athleticism
      clutch: 'kobe', // clutch
      leadership: 'duncan', // leadership
    };
    const r = scoreBuild(picks, 'nba-legends');

    expect(r.slots.map((s) => s.score)).toEqual([99, 99, 99, 99, 98, 96]);
    expect(r.base).toBe(98);
    expect(r.synergy.rolesCovered).toBe(6);
    expect(r.synergy.emptyRoles).toEqual([]);
    expect(r.overall).toBe(99); // base 98.3 x diversity+franchise, capped at 99
    expect(r.tier.label).toBe('IMMORTAL GOAT');
    expect(r.badges).toContain('🌐 Complete Squad');
    expect(r.badges).toContain('💯 No Weak Links');
  });

  it('stacking one signature role leaves empty roles and caps the overall below base', () => {
    // Jordan's signature is scoring; using him everywhere leaves 5 roles empty.
    const picks = {
      scoring: 'jordan',
      playmaking: 'jordan',
      defense: 'jordan',
      athleticism: 'jordan',
      clutch: 'jordan',
      leadership: 'jordan',
    };
    const r = scoreBuild(picks, 'nba-legends');

    expect(r.synergy.rolesCovered).toBe(1);
    expect(r.synergy.emptyRoles).toHaveLength(5);
    expect(r.synergy.cap).toBe(99 - 5 * 2); // 89
    expect(r.overall).toBe(89); // capped below the 96 base
    expect(r.base).toBe(96);
    expect(r.chemistry).toBeLessThan(0); // the cap pulled it down
  });

  it('throws on an incomplete build', () => {
    expect(() => scoreBuild({ scoring: 'jordan' }, 'nba-legends')).toThrow();
  });
});

describe('projectBuild (partial)', () => {
  it('returns 0 for an empty build', () => {
    const p = projectBuild({}, 'nba-legends');
    expect(p.overall).toBe(0);
    expect(p.filled).toBe(0);
    expect(p.total).toBe(6);
  });

  it('averages the filled slots as they come in', () => {
    const p = projectBuild({ scoring: 'jordan', defense: 'russell' }, 'nba-legends');
    expect(p.filled).toBe(2);
    expect(p.overall).toBe(Math.round((99 + 99) / 2)); // jordan scoring 99, russell defense 99
  });
});
