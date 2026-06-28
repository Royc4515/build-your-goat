// The attribute "slots" the player fills to build their GOAT.
// Round order follows this array. Each id matches a key in every player's attrs.

/**
 * @typedef {Object} Category
 * @property {string} id       Matches Player.attrs key.
 * @property {string} label    Display name.
 * @property {string} icon     Emoji shown on the slot.
 * @property {string} tagline  Short flavor text.
 * @property {string} accent   Accent color for the round UI.
 */

/** @type {Category[]} */
export const CATEGORIES = Object.freeze([
  cat('scoring', 'Scoring', '🏀', 'Pure bucket-getting', '#ff6b35'),
  cat('playmaking', 'Playmaking', '🎯', 'Court vision & dimes', '#4cc9f0'),
  cat('defense', 'Defense', '🛡️', 'Lockdown on a string', '#7b2ff7'),
  cat('athleticism', 'Athleticism', '⚡', 'Hops, speed, motor', '#ffd60a'),
  cat('clutch', 'Clutch', '❄️', 'Ice in the veins', '#06d6a0'),
  cat('leadership', 'Leadership', '👑', 'The will to win', '#ef476f'),
]);

function cat(id, label, icon, tagline, accent) {
  return Object.freeze({ id, label, icon, tagline, accent });
}

export const TOTAL_ROUNDS = CATEGORIES.length;
