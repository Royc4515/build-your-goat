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
}

/** A game mode: a sport, a category set, and the roster it draws from. */
export interface Mode {
  readonly sport: Sport;
  readonly icon: string;
  readonly categories: readonly Category[];
  readonly label: string;
  readonly live: boolean;
}
