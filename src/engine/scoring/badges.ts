// Earned flair shown on the result card. Pure: derived from the picked players
// and their per-slot scores.

import type { Player, ScoredSlot } from '../types.js';

export function badgesFor(
  players: readonly Player[],
  slots: readonly ScoredSlot[],
): string[] {
  const badges: string[] = [];

  if (maxDuplicateCount(players.map((p) => p.id)) >= 3) badges.push('🦸 One-Man Army');
  if (maxDuplicateCount(players.map((p) => p.team)) >= 4) badges.push('🏟️ Team Core');
  if (isUniform(players.map((p) => p.era))) badges.push(`⏳ ${players[0]?.era ?? ''} Era Squad`);
  if (new Set(players.map((p) => p.id)).size === slots.length) badges.push('🌍 All-Star Mix');
  if (slots.every((s) => s.score >= 90)) badges.push('💯 No Weak Links');

  return badges;
}

export function maxDuplicateCount(keys: readonly string[]): number {
  if (keys.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  return Math.max(...counts.values());
}

export function isUniform(keys: readonly string[]): boolean {
  return keys.every((k) => k === keys[0]);
}
