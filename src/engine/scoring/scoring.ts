// Pure scoring for a GOAT build. Per-slot score = the player's rating in that
// category. The overall is the slot average lifted by a synergy MULTIPLIER and
// held under a cap set by how many signature-roles the build leaves uncovered
// (M4 — replaces the old flat chemistry bonus).

import type {
  BuildResult,
  Category,
  CategoryId,
  ModeId,
  PlayerId,
  ScoredSlot,
  Tier,
} from '../types.js';
import { categoriesForMode, playerForMode } from '../../data/modes.js';
import { tierFor } from './tiers.js';
import { badgesFor } from './badges.js';
import { evaluateSynergies } from '../archetypes/synergy.js';
import { MAX_OVERALL } from '../../data/archetypeDefs.js';

/** Score a completed build (throws if any slot is unfilled). */
export function scoreBuild(
  picks: Readonly<Record<CategoryId, PlayerId>>,
  mode: ModeId,
): BuildResult {
  const categories = categoriesForMode(mode);
  const slots = categories.map((c) => slotFor(c, picks, mode));
  const players = slots.map((s) => playerForMode(mode, s.playerId));

  const base = avg(slots.map((s) => s.score));
  const synergy = evaluateSynergies(players, categories);
  const overall = clamp(Math.round(base * synergy.multiplier), 0, Math.min(MAX_OVERALL, synergy.cap));

  return {
    slots,
    base: Math.round(base),
    chemistry: overall - Math.round(base),
    overall,
    tier: tierFor(overall),
    synergy,
    badges: badgesFor(synergy.completed, slots),
  };
}

/** A lightweight live projection for an in-progress build: the running average
 *  of the filled slots (no synergy — that needs the full team to be meaningful). */
export function projectBuild(
  picks: Readonly<Record<CategoryId, PlayerId>>,
  mode: ModeId,
): { overall: number; tier: Tier; filled: number; total: number } {
  const categories = categoriesForMode(mode);
  const filled = categories.filter((c) => picks[c.id]).map((c) => slotFor(c, picks, mode));
  const total = categories.length;
  if (filled.length === 0) return { overall: 0, tier: tierFor(0), filled: 0, total };
  const overall = Math.round(avg(filled.map((s) => s.score)));
  return { overall, tier: tierFor(overall), filled: filled.length, total };
}

function slotFor(
  c: Category,
  picks: Readonly<Record<CategoryId, PlayerId>>,
  mode: ModeId,
): ScoredSlot {
  const playerId = picks[c.id];
  if (!playerId) throw new Error(`scoreBuild: missing pick for category '${c.id}'`);
  const player = playerForMode(mode, playerId);
  const score = player.attrs[c.id];
  if (score === undefined) {
    throw new Error(`scoreBuild: player '${playerId}' has no '${c.id}' rating`);
  }
  return { categoryId: c.id, label: c.label, icon: c.icon, accent: c.accent, playerId, score };
}

function avg(nums: readonly number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
