// Shared domain types for the whole game. This module is pure type declarations
// (no runtime, no imports of DOM/audio/storage), so both the engine and the data
// layer can depend on it without creating runtime coupling — consumers import it
// with `import type`, which is erased at build time.

export type CategoryId = string;
export type PlayerId = string;
export type ModeId = string;
export type ArchetypeId = string;
export type RoleId = string;
export type Sport = 'basketball' | 'soccer';

/** One of the skill "slots" a player is drafted into; also the round order. */
export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly icon: string;
  readonly tagline: string;
  readonly accent: string;
}

/** A draftable player. `attrs` are 0–99 ratings keyed by `Category.id`. */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly short: string;
  readonly monogram: string;
  readonly number: number;
  readonly team: string;
  readonly era: string;
  readonly colors: readonly [string, string];
  readonly attrs: Readonly<Record<CategoryId, number>>;
  readonly nbaId: number | null;
  /** Wikimedia Commons file name for non-NBA players (soccer/EuroLeague); null
   *  when the player has no free photo and falls back to CSS jersey art. */
  readonly photo: string | null;
}

/** A game mode: a sport, a category set, and the roster it draws from. */
export interface Mode {
  readonly sport: Sport;
  readonly icon: string;
  readonly categories: readonly Category[];
  readonly label: string;
  readonly live: boolean;
}

// --- scoring -----------------------------------------------------------------

/** A rating tier the final overall falls into. */
export interface Tier {
  readonly label: string;
  readonly emoji: string;
  readonly blurb: string;
}

/** One scored slot of a completed build: the player picked for a category and
 *  their rating in that specific category. */
export interface ScoredSlot {
  readonly categoryId: CategoryId;
  readonly label: string;
  readonly icon: string;
  readonly accent: string;
  readonly playerId: PlayerId;
  readonly score: number;
}

/** A synergy that fired for a build (applied multiplicatively). */
export interface CompletedSynergy {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly multiplier: number;
}

/** Result of evaluating archetype/role synergies for a set of picked players.
 *  Completed synergies multiply the base; empty roles lower the cap. */
export interface SynergyResult {
  readonly multiplier: number;
  readonly completed: readonly CompletedSynergy[];
  /** Categories that are no picked player's signature (primary) role. */
  readonly emptyRoles: readonly CategoryId[];
  readonly rolesCovered: number;
  readonly cap: number;
}

/** The full result of scoring a completed build. */
export interface BuildResult {
  readonly slots: readonly ScoredSlot[];
  readonly base: number;
  /** The synergy boost as an additive number (overall - base), for display. */
  readonly chemistry: number;
  readonly overall: number;
  readonly tier: Tier;
  readonly synergy: SynergyResult;
  readonly badges: readonly string[];
}

// --- match -------------------------------------------------------------------

/** How a match is being played. Solo today; the rest arrive in later milestones,
 *  but they share this one state machine (only setup + opponents differ). */
export type MatchKind = 'solo' | 'vsAI' | 'hotseat' | 'daily';

/** Phase WITHIN a match (distinct from app-level screen navigation). */
export type MatchPhase = 'spinning' | 'reveal' | 'result';

export interface MatchConfig {
  readonly kind: MatchKind;
  readonly mode: ModeId;
  /** Deterministic seed: dailySeed(date) for daily; host entropy otherwise. */
  readonly seed: number;
}

/** A pick captured but not yet confirmed (shown on the reveal screen). */
export interface Reveal {
  readonly categoryId: CategoryId;
  readonly playerId: PlayerId;
}

/** The shared draft pool. `order` is the fixed seeded permutation of the whole
 *  roster; `available` drains as players are locked (so the reel only ever shows
 *  who is still pickable — the contention/denial spine of the strategic layer).
 *
 *  NOTE: at match start `available === order`, but after a Reroll `available` is
 *  an arbitrary permutation of the *remaining* set — do NOT assume it stays a
 *  subsequence of `order`. */
export interface Pool {
  readonly order: readonly PlayerId[];
  readonly available: readonly PlayerId[];
}

/** Scarce, use-it-or-lose-it power-ups for a single match. */
export interface EconomyState {
  /** Re-spins the remaining pool order (refresh which faces the reel shows). */
  readonly rerolls: number;
  /** Slows the reel for one round, for a more precise lock. */
  readonly freezes: number;
}

export interface MatchState {
  readonly config: MatchConfig;
  readonly phase: MatchPhase;
  readonly round: number;
  readonly picks: Readonly<Record<CategoryId, PlayerId>>;
  /** Seeded draft pool; the reel cycles `pool.available`. */
  readonly pool: Pool;
  readonly economy: EconomyState;
  /** Whether the current round's reel is slowed by a spent Freeze. */
  readonly frozen: boolean;
  /** Serialized PRNG counter — keeps the state pure and the match replayable. */
  readonly rngState: number;
  readonly reveal: Reveal | null;
}
