// Headshot URL + preloading. This is the ONLY data module that touches the DOM
// (`Image`), kept separate so players.ts / modes.ts stay engine-pure.
//
// Two photo sources: `nbaId` (official NBA CDN cutout) and `photo` (a Wikimedia
// Commons file name, served via the stable Special:FilePath redirect — how
// soccer/EuroLeague players get real faces). `photo` wins if both are present;
// players with neither fall back to CSS jersey art.

import type { Player, ModeId } from '../engine/types.js';
import { rosterForMode } from './modes.js';

/** Headshot URL for a player, or null when they carry no photo source. */
export function headshotUrl(player: Player): string | null {
  if (player.photo) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(player.photo)}?width=512`;
  }
  if (player.nbaId) {
    return `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.nbaId}.png`;
  }
  return null;
}

/** True if the player has any photo source (NBA id or Commons file). */
export function hasHeadshot(player: Player): boolean {
  return Boolean(player.photo || player.nbaId);
}

/** Warm the browser cache for a mode (any player with a photo source). */
export function preloadModeHeadshots(mode: ModeId): void {
  for (const p of rosterForMode(mode)) {
    const url = headshotUrl(p);
    if (!url) continue;
    const img = new Image();
    img.src = url;
  }
}
