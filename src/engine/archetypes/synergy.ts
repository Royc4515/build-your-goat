// Synergy evaluation: turns a set of picked players into a multiplier + cap.
// Completed synergies multiply the base rating; roles no one covers lower the
// ceiling. Pure — no DOM, no randomness.

import type { Category, CompletedSynergy, Player, SynergyResult } from '../types.js';
import {
  DIVERSITY_TIERS,
  FRANCHISE_CORE,
  DYNASTY_ERA,
  EMPTY_ROLE_PENALTY,
  MIN_CAP,
  MAX_OVERALL,
} from '../../data/archetypeDefs.js';
import { primaryRole } from './archetypes.js';

export function evaluateSynergies(
  players: readonly Player[],
  categories: readonly Category[],
): SynergyResult {
  const primaries = players.map((p) => primaryRole(p, categories));
  const covered = new Set(primaries);
  const emptyRoles = categories.filter((c) => !covered.has(c.id)).map((c) => c.id);
  const rolesCovered = covered.size;

  const completed: CompletedSynergy[] = [];

  // Role-diversity tier (first matching tier wins; tiers are ordered best-first).
  const shortfall = categories.length - rolesCovered;
  const tier = DIVERSITY_TIERS.find((t) => shortfall <= t.maxShortfall);
  if (tier) {
    completed.push({ id: tier.id, label: tier.label, icon: tier.icon, multiplier: tier.multiplier });
  }

  // Themed synergies on shared traits.
  if (maxDuplicateCount(players.map((p) => p.team)) >= FRANCHISE_CORE.minSameTeam) {
    completed.push({
      id: FRANCHISE_CORE.id,
      label: FRANCHISE_CORE.label,
      icon: FRANCHISE_CORE.icon,
      multiplier: FRANCHISE_CORE.multiplier,
    });
  }
  if (maxDuplicateCount(players.map((p) => p.era)) >= DYNASTY_ERA.minSameEra) {
    completed.push({
      id: DYNASTY_ERA.id,
      label: DYNASTY_ERA.label,
      icon: DYNASTY_ERA.icon,
      multiplier: DYNASTY_ERA.multiplier,
    });
  }

  const multiplier = completed.reduce((m, s) => m * s.multiplier, 1);
  const cap = Math.max(MIN_CAP, MAX_OVERALL - emptyRoles.length * EMPTY_ROLE_PENALTY);

  return { multiplier, completed, emptyRoles, rolesCovered, cap };
}

export function maxDuplicateCount(keys: readonly string[]): number {
  if (keys.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  return Math.max(...counts.values());
}
