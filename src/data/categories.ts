// The attribute "slots" the player fills to build their GOAT.
// Round order follows this array. Each id matches a key in every player's attrs.

import type { Category } from '../engine/types.js';

export const CATEGORIES: readonly Category[] = Object.freeze([
  cat('scoring', 'Scoring', '🏀', 'Pure bucket-getting', '#ff6b35'),
  cat('playmaking', 'Playmaking', '🎯', 'Court vision & dimes', '#4cc9f0'),
  cat('defense', 'Defense', '🛡️', 'Lockdown on a string', '#7b2ff7'),
  cat('athleticism', 'Athleticism', '⚡', 'Hops, speed, motor', '#ffd60a'),
  cat('clutch', 'Clutch', '❄️', 'Ice in the veins', '#06d6a0'),
  cat('leadership', 'Leadership', '👑', 'The will to win', '#ef476f'),
]);

function cat(
  id: string,
  label: string,
  icon: string,
  tagline: string,
  accent: string,
): Category {
  return Object.freeze({ id, label, icon, tagline, accent });
}

export const TOTAL_ROUNDS = CATEGORIES.length;
