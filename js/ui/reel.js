// The slot-machine reel: cycles player cards for the current category with a
// smooth cross-slide (one card rises into the centre as the last slides up and
// out). "Lock In" decelerates and snaps to a pick, like the TikTok GOAT filter.
// One reel is alive per round; call destroy() before the next to avoid leaks.

import { clear } from './dom.js';
import { playerCard } from './playerCard.js';
import { shuffle } from '../core/random.js';
import { sfx } from './sound.js';
import { getSetting } from '../core/settings.js';

// Base cadence (ms) between faces, by user-chosen reel speed. Tuned on the slow
// side so each transition spans several frames and reads as smooth, continuous
// motion at the display's refresh rate rather than a strobe.
const SPIN_MS_BY_SPEED = { chill: 340, normal: 240, hyper: 150 };

// Deceleration tail as multipliers of the base cadence — always slower than the
// spin and increasing, so the reel eases to a stop regardless of chosen speed.
const DECEL_FACTORS = [1.3, 1.7, 2.3, 3.2, 4.4, 6.2];

/**
 * @param {Object} cfg
 * @param {HTMLElement} cfg.mount      Container the current card lives in.
 * @param {import('../data/categories.js').Category} cfg.category
 * @param {import('../data/players.js').Player[]} cfg.pool   Players to cycle.
 * @param {(player:import('../data/players.js').Player)=>void} cfg.onSettled
 * @returns {{ lock:()=>void, destroy:()=>void, isLocking:()=>boolean }}
 */
export function createReel({ mount, category, pool, onSettled }) {
  const order = shuffle(pool);
  const spinMs = SPIN_MS_BY_SPEED[getSetting('reelSpeed')] ?? SPIN_MS_BY_SPEED.normal;
  const animate = getSetting('spinFx') !== false;
  const slideMs = Math.round(spinMs * 0.96); // spans almost the full tick for continuous flow

  let index = 0;
  let current = null;
  let spinTimer = null;
  let decelTimers = [];
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

    // Walk the deceleration tail, then settle on whatever lands last.
    let step = 0;
    const tick = () => {
      if (destroyed) return;
      if (step >= DECEL_FACTORS.length) {
        const finalPlayer = order[index];
        if (current) {
          current.classList.remove('reel-card--in', 'reel-card--out');
          current.classList.add('card--locked');
        }
        sfx.lock();
        onSettled(finalPlayer);
        return;
      }
      advance();
      sfx.tick();
      const delay = Math.round(spinMs * DECEL_FACTORS[step]);
      decelTimers.push(window.setTimeout(tick, delay));
      step += 1;
    };
    tick();
  }

  function destroy() {
    destroyed = true;
    if (spinTimer) window.clearTimeout(spinTimer);
    decelTimers.forEach((t) => window.clearTimeout(t));
    exitTimers.forEach((t) => window.clearTimeout(t));
    decelTimers = [];
    exitTimers = [];
  }

  // Kick off immediately.
  show(order[index]);
  spinTimer = window.setTimeout(spin, spinMs);

  return { lock, destroy, isLocking: () => locking };
}
