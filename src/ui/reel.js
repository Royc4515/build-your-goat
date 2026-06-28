// The reel: cycles player cards for the current category with a smooth
// cross-slide (one card slides in as the last slides out). "Lock In" captures
// the player shown at the exact moment you press — so winning is about timing,
// not luck. One reel is alive per round; call destroy() before the next.

import { clear } from './dom.js';
import { playerCard } from './playerCard.js';
import { sfx } from './sound.js';
import { getSetting } from '../core/settings.js';

// Base cadence (ms) between faces, by user-chosen reel speed. The cadence is the
// player's reaction window — slower = easier to nail a target, faster = harder.
// "normal" is deliberately brisk so the default game takes real timing skill.
const SPIN_MS_BY_SPEED = { chill: 320, normal: 190, hyper: 115 };

/**
 * @param {Object} cfg
 * @param {HTMLElement} cfg.mount      Container the current card lives in.
 * @param {import('../data/categories.js').Category} cfg.category
 * @param {import('../data/players.js').Player[]} cfg.pool   Players to cycle.
 * @param {(player:import('../data/players.js').Player)=>void} cfg.onSettled
 * @returns {{ lock:()=>void, destroy:()=>void, isLocking:()=>boolean }}
 */
export function createReel({ mount, category, pool, onSettled }) {
  // `pool` is already in the engine's seeded order — cycle it as given so the
  // reel sequence is deterministic (no Math.random here).
  const order = pool;
  const spinMs = SPIN_MS_BY_SPEED[getSetting('reelSpeed')] ?? SPIN_MS_BY_SPEED.normal;
  const animate = getSetting('spinFx') !== false;
  const slideMs = spinMs; // spans the full tick → one continuous, constant-speed stream

  let index = 0;
  let current = null;
  let spinTimer = null;
  let exitTimers = [];
  let locking = false;
  let destroyed = false;

  function show(player) {
    const card = playerCard(player, { category });
    card.classList.add('reel-card');

    if (!animate) {
      // Spin FX off: hard swap, single card, no overlap.
      clear(mount);
      current = card;
      mount.append(card);
      return;
    }

    card.style.setProperty('--rd', `${slideMs}ms`);
    card.classList.add('reel-card--in');

    // Slide the previous card up and out, then remove it. animationend is the
    // primary trigger; a timer is the fallback if the event is ever missed.
    if (current) {
      const leaving = current;
      leaving.classList.remove('reel-card--in');
      leaving.classList.add('reel-card--out');
      const remove = () => leaving.remove();
      leaving.addEventListener('animationend', remove, { once: true });
      exitTimers.push(window.setTimeout(remove, slideMs + 120));
    }

    current = card;
    mount.append(card);
  }

  function advance() {
    index = (index + 1) % order.length;
    show(order[index]);
  }

  function spin() {
    advance();
    if (Math.random() < 0.4) sfx.tick();
    spinTimer = window.setTimeout(spin, spinMs);
  }

  function lock() {
    if (locking || destroyed) return;
    locking = true;
    window.clearTimeout(spinTimer);
    spinTimer = null;
    // Freeze on exactly the face on screen right now — no deceleration past it.
    sfx.lock();
    onSettled(order[index]);
  }

  function destroy() {
    destroyed = true;
    if (spinTimer) window.clearTimeout(spinTimer);
    exitTimers.forEach((t) => window.clearTimeout(t));
    exitTimers = [];
  }

  // Kick off immediately.
  show(order[index]);
  spinTimer = window.setTimeout(spin, spinMs);

  return { lock, destroy, isLocking: () => locking };
}
