import { describe, it, expect } from 'vitest';
import { scoreBuild } from './scoring.js';

// nba-legends categories: scoring, playmaking, defense, athleticism, clutch, leadership.

describe('scoreBuild', () => {
  it('scores a one-man-army Jordan build (chemistry capped, IMMORTAL)', () => {
    const picks = {
      scoring: 'jordan',
      playmaking: 'jordan',
      defense: 'jordan',
      athleticism: 'jordan',
      clutch: 'jordan',
      leadership: 'jordan',
    };
    const r = scoreBuild(picks, 'nba-legends');

    // per-slot = Jordan's rating in each category
    expect(r.slots.map((s) => s.score)).toEqual([99, 85, 96, 97, 99, 98]);
    expect(r.base).toBe(96); // round(574/6)
    expect(r.chemistry).toBe(6); // 4 (one-man) + 2 (team) + 3 (era) capped at 6
    expect(r.overall).toBe(99); // clamp(round(95.67 + 6))
    expect(r.tier.label).toBe('IMMORTAL GOAT');
    expect(r.badges).toContain('🦸 One-Man Army');
    expect(r.badges).toContain('🏟️ Team Core');
    expect(r.badges).toContain('⏳ 90s Era Squad');
    expect(r.badges).not.toContain('🌍 All-Star Mix');
    expect(r.badges).not.toContain('💯 No Weak Links');
  });

  it('scores a diverse specialist build (no chemistry, mix + no weak links)', () => {
    const picks = {
      scoring: 'jordan', // 99
      playmaking: 'magic', // 99
      defense: 'russell', // 99
      athleticism: 'lebron', // 99
      clutch: 'kobe', // 98
      leadership: 'duncan', // 96
    };
    const r = scoreBuild(picks, 'nba-legends');

    expect(r.slots.map((s) => s.score)).toEqual([99, 99, 99, 99, 98, 96]);
    expect(r.base).toBe(98); // round(590/6)
    expect(r.chemistry).toBe(0);
    expect(r.overall).toBe(98);
    expect(r.tier.label).toBe('IMMORTAL GOAT');
    expect(r.badges).toContain('🌍 All-Star Mix');
    expect(r.badges).toContain('💯 No Weak Links');
    expect(r.badges).not.toContain('🦸 One-Man Army');
  });

  it('throws on an incomplete build', () => {
    expect(() => scoreBuild({ scoring: 'jordan' }, 'nba-legends')).toThrow();
  });
});
