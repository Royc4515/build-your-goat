// Rating tiers for a completed build, evaluated top-down (first match wins).

import type { Tier } from '../types.js';

interface TierBand extends Tier {
  readonly min: number;
}

const TIERS: readonly TierBand[] = Object.freeze([
  { min: 96, label: 'IMMORTAL GOAT', emoji: '🐐', blurb: 'A sporting deity. Statues will be built.' },
  { min: 92, label: 'Inner-Circle Legend', emoji: '🏆', blurb: 'Top-shelf, first-ballot, no debate.' },
  { min: 88, label: 'Hall of Famer', emoji: '🌟', blurb: 'A legendary career carved in stone.' },
  { min: 84, label: 'Perennial All-Star', emoji: '✨', blurb: 'Franchise cornerstone, fans love you.' },
  { min: 80, label: 'Quality Starter', emoji: '💪', blurb: 'Solid every night. Coaches trust you.' },
  { min: 0, label: 'Role Player', emoji: '🔧', blurb: 'Every champion needs glue guys.' },
]);

export function tierFor(overall: number): Tier {
  const t = TIERS.find((x) => overall >= x.min) ?? TIERS[TIERS.length - 1]!;
  return { label: t.label, emoji: t.emoji, blurb: t.blurb };
}
