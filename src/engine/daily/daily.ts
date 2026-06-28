// Deterministic daily-challenge helpers. Pure — no DOM, no Date.now(), no
// Math.random(). The caller passes the UTC date string so this stays testable.

import type { ModeId } from '../types.js';

/** The fixed mode used for every daily challenge. */
export const DAILY_MODE: ModeId = 'nba-legends';

/** Today's date as a UTC YYYY-MM-DD string. Call only at the UI layer (not in
 *  engine tests) since it reads the real clock. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** FNV-1a 32-bit hash → deterministic seed for a given date.
 *  Same date always produces the same seed on every device. */
export function dailySeed(dateStr: string): number {
  const input = `${dateStr}:byg-daily`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Sequential day number starting from 1 on 2025-01-01 (UTC). Used in the
 *  "Daily #N" badge and the emoji share card. */
export function dailyNumber(dateStr: string): number {
  const epoch = Date.UTC(2025, 0, 1);
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  const day = Date.UTC(y, m - 1, d);
  return Math.floor((day - epoch) / 86_400_000) + 1;
}
