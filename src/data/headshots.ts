// Headshot URL + preloading. This is the ONLY data module that touches the DOM
// (`Image`), kept separate so players.ts / modes.ts stay engine-pure. Only NBA
// players carry an `nbaId`; everyone else falls back to CSS jersey art.

import type { Player, ModeId } from '../engine/types.js';
import { rosterForMode } from './modes.js';

/** Official NBA headshot URL (transparent-background cutout) for a player. */
export function headshotUrl(player: Player): string {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.nbaId}.png`;
}

/** Warm the browser cache for a mode so the fast reel never flashes blank. */
export function preloadModeHeadshots(mode: ModeId): void {
  for (const p of rosterForMode(mode)) {
    if (p.nbaId) {
      const img = new Image();
      img.src = headshotUrl(p);
    }
  }
}
