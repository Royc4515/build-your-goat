// Renders one play round: the category banner, the spinning reel, the LOCK IN
// button, and the tray of slots filled so far. Owns the reel's lifecycle and
// returns a cleanup function the caller MUST run before the next round.

import { el, clear } from './dom.js';
import { CATEGORIES, TOTAL_ROUNDS } from '../data/categories.js';
import { PLAYERS, PLAYERS_BY_ID } from '../data/players.js';
import { currentCategory } from '../core/state.js';
import { createReel } from './reel.js';
import { sfx } from './sound.js';

const REVEAL_HOLD_MS = 800; // pause on the locked card before advancing

/**
 * Mount the current round.
 * @param {HTMLElement} root
 * @param {import('../core/state.js').GameState} state
 * @param {{ onLocked:(playerId:string)=>void, onPause:()=>void }} handlers
 * @returns {() => void}  cleanup
 */
export function mountPlayRound(root, state, { onLocked, onPause }) {
  clear(root);
  const category = currentCategory(state);
  const stage = el('div', { class: 'reel-stage' });

  const lockBtn = el('button', {
    class: 'btn btn--lock',
    text: '🔒  LOCK IN',
    attrs: { type: 'button' },
  });

  const pauseBtn = el('button', {
    class: 'iconbtn play__pause',
    text: '⏸',
    attrs: { type: 'button', 'aria-label': 'Pause' },
  });

  let locking = false; // true once a pick is being locked in (no pausing then)
  let revealTimer = null;

  const screen = el('section', {
    class: 'screen play',
    style: { '--accent': category.accent },
    children: [
      progressBar(state.round, pauseBtn),
      categoryBanner(category),
      stage,
      lockBtn,
      slotTray(state.picks, state.round),
    ],
  });
  root.append(screen);

  const reel = createReel({
    mount: stage,
    category,
    pool: PLAYERS,
    onSettled: (player) => {
      // Reel has snapped; hold on the reveal, then advance the game.
      lockBtn.disabled = true;
      lockBtn.textContent = `✅  ${player.short}`;
      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        onLocked(player.id);
      };
      revealTimer = window.setTimeout(advance, REVEAL_HOLD_MS);
    },
  });

  const onLockClick = () => {
    if (reel.isLocking()) return;
    sfx.click();
    locking = true;
    pauseBtn.disabled = true; // committing to a pick — don't allow pausing mid-lock
    lockBtn.classList.add('btn--lock-active');
    reel.lock();
  };
  lockBtn.addEventListener('click', onLockClick);

  const requestPause = () => {
    if (locking) return;
    sfx.click();
    onPause();
  };
  pauseBtn.addEventListener('click', requestPause);

  // Spacebar / Enter locks; Escape pauses.
  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      onLockClick();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      requestPause();
    }
  };
  window.addEventListener('keydown', onKey);

  return () => {
    reel.destroy();
    if (revealTimer) window.clearTimeout(revealTimer);
    window.removeEventListener('keydown', onKey);
  };
}

function progressBar(round, pauseBtn) {
  const dots = CATEGORIES.map((_, i) =>
    el('span', {
      class: ['dot', i < round ? 'dot--done' : i === round ? 'dot--active' : 'dot--todo'],
    })
  );
  return el('div', {
    class: 'progress',
    children: [
      el('div', {
        class: 'progress__left',
        children: [pauseBtn, el('div', { class: 'progress__label', text: `Round ${round + 1} of ${TOTAL_ROUNDS}` })],
      }),
      el('div', { class: 'progress__dots', children: dots }),
    ],
  });
}

function categoryBanner(category) {
  return el('div', {
    class: 'cat-banner',
    children: [
      el('span', { class: 'cat-banner__icon', text: category.icon }),
      el('div', {
        children: [
          el('div', { class: 'cat-banner__label', text: category.label }),
          el('div', { class: 'cat-banner__tag', text: category.tagline }),
        ],
      }),
    ],
  });
}

function slotTray(picks, round) {
  const slots = CATEGORIES.map((c, i) => {
    const pickedId = picks[c.id];
    const filled = Boolean(pickedId);
    return el('div', {
      class: ['slot', filled ? 'slot--filled' : i === round ? 'slot--active' : 'slot--empty'],
      attrs: { title: c.label },
      children: [
        el('span', { class: 'slot__icon', text: c.icon }),
        el('span', {
          class: 'slot__who',
          text: filled ? PLAYERS_BY_ID[pickedId].short : '—',
        }),
      ],
    });
  });
  return el('div', { class: 'tray', children: slots });
}
