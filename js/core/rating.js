// Pure scoring logic for a completed GOAT build.
// Given the picks (categoryId -> playerId) it computes the overall rating,
// per-slot scores, chemistry bonus, tier and badges. No DOM, no side effects.

import { CATEGORIES } from '../data/categories.js';
import { PLAYERS_BY_ID } from '../data/players.js';

/** Rating tiers, evaluated top-down; first match wins. */
const TIERS = Object.freeze([
  { min: 96, label: 'IMMORTAL GOAT', emoji: '🐐', blurb: 'A basketball deity. Statues will be built.' },
  { min: 92, label: 'Inner-Circle Legend', emoji: '🏆', blurb: 'Top-shelf, first-ballot, no debate.' },
  { min: 88, label: 'Hall of Famer', emoji: '🌟', blurb: 'A legendary career carved in stone.' },
  { min: 84, label: 'Perennial All-Star', emoji: '✨', blurb: 'Franchise cornerstone, fans love you.' },
  { min: 80, label: 'Quality Starter', emoji: '💪', blurb: 'Solid every night. Coaches trust you.' },
  { min: 0, label: 'Role Player', emoji: '🔧', blurb: 'Every champion needs glue guys.' },
]);

/**
 * @param {Record<string,string>} picks  categoryId -> playerId
 * @returns {{
 *   slots: {categoryId:string,label:string,icon:string,accent:string,playerId:string,score:number}[],
 *   base:number, chemistry:number, overall:number,
 *   tier:{label:string,emoji:string,blurb:string},
 *   badges:string[]
 * }}
 */
export function scoreBuild(picks) {
  const slots = CATEGORIES.map((c) => {
    const player = PLAYERS_BY_ID[picks[c.id]];
    return {
      categoryId: c.id,
      label: c.label,
      icon: c.icon,
      accent: c.accent,
      playerId: player.id,
      score: player.attrs[c.id],
    };
  });

  const base = avg(slots.map((s) => s.score));
  const chemistry = chemistryBonus(slots);
  const overall = clamp(Math.round(base + chemistry), 0, 99);

  return {
    slots,
    base: Math.round(base),
    chemistry,
    overall,
    tier: tierFor(overall),
    badges: badgesFor(slots),
  };
}

/**
 * Chemistry rewards thematic builds: stacking one player ("one-man army"),
 * leaning on a single franchise, or a single-era squad. Capped so it tops up
 * a good build rather than dominating it.
 */
function chemistryBonus(slots) {
  const players = slots.map((s) => PLAYERS_BY_ID[s.playerId]);
  let bonus = 0;

  bonus += maxDuplicateCount(players.map((p) => p.id)) >= 3 ? 4 : 0; // one-man army
  bonus += maxDuplicateCount(players.map((p) => p.team)) >= 4 ? 2 : 0; // franchise core
  bonus += isUniform(players.map((p) => p.era)) ? 3 : 0; // same-era squad

  return Math.min(bonus, 6);
}

/** Earned flair shown on the result card. */
function badgesFor(slots) {
  const players = slots.map((s) => PLAYERS_BY_ID[s.playerId]);
  const badges = [];

  if (maxDuplicateCount(players.map((p) => p.id)) >= 3) badges.push('🦸 One-Man Army');
  if (maxDuplicateCount(players.map((p) => p.team)) >= 4) badges.push('🏟️ Franchise Core');
  if (isUniform(players.map((p) => p.era))) badges.push(`⏳ ${players[0].era} Era Squad`);
  if (new Set(players.map((p) => p.id)).size === slots.length) badges.push('🌍 All-Star Mix');
  if (slots.every((s) => s.score >= 90)) badges.push('💯 No Weak Links');

  return badges;
}

// --- small numeric helpers -------------------------------------------------

function tierFor(overall) {
  const t = TIERS.find((x) => overall >= x.min);
  return { label: t.label, emoji: t.emoji, blurb: t.blurb };
}

function avg(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function maxDuplicateCount(keys) {
  const counts = keys.reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
  return Math.max(...counts.values());
}

function isUniform(keys) {
  return keys.every((k) => k === keys[0]);
}
