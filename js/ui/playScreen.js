// Renders the two states of an active round:
//   mountPlayRound — the spinning reel + LOCK IN. Pressing lock captures the
//     face on screen at that instant (skill, not luck) and commits it.
//   mountReveal    — shows the just-locked pick for a beat before advancing.
// Both carry a pause button that works at all times. Categories, roster and
// player lookups all come from the active mode (state.mode), so the same screen
// plays NBA / EuroLeague / Soccer. Each returns a cleanup function the caller
// MUST run before mounting the next view.

import { el, clear } from './dom.js';
import { currentCategory } from '../core/state.js';
import { categoriesForMode, rosterForMode, playerForMode } from '../data/modes.js';
import { createReel } from './reel.js';
import { playerCard } from './playerCard.js';
import { sfx } from './sound.js';

const REVEAL_MS = 1100; // how long the locked pick is shown before auto-advancing

/**
 * Mount the spinning round.
 * @param {HTMLElement} root
 * @param {import('../core/state.js').GameState} state
 * @param {{ onLocked:(playerId:string)=>void, onPause:()=>void }} handlers
 * @returns {() => void}  cleanup
 */
export function mountPlayRound(root, state, { onLocked, onPause }) {
  clear(root);
  const category = currentCategory(state);
  const stage = el('div', { class: 'reel-stage' });
  const pauseBtn = makePauseBtn(onPause);

  const lockBtn = el('button', {
    class: 'btn btn--lock',
    text: '🔒  LOCK IN',
    attrs: { type: 'button' },
  });

  const screen = el('section', {
    class: 'screen play',
    style: { '--accent': category.accent },
    children: [
      progressBar(state, pauseBtn),
      categoryBanner(category),
      stage,
      lockBtn,
      slotTray(state),
    ],
  });
  root.append(screen);

  const reel = createReel({
    mount: stage,
    category,
    pool: rosterForMode(state.mode),
    // Captured at press time; commit straight away. The reveal STATE shows it,
    // so a pause can never lose an earned pick.
    onSettled: (player) => onLocked(player.id),
  });

  const onLockClick = () => {
    if (reel.isLocking()) return;
    reel.lock(); // captures the current face and fires onSettled synchronously
  };
  lockBtn.addEventListener('click', onLockClick);

  // Spacebar / Enter locks; Escape pauses (pause is allowed at any time).
  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      onLockClick();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      onPause();
    }
  };
  window.addEventListener('keydown', onKey);

  return () => {
    reel.destroy();
    window.removeEventListener('keydown', onKey);
  };
}

/**
 * Mount the reveal of a just-locked pick (state.reveal must be set).
 * @param {HTMLElement} root
 * @param {import('../core/state.js').GameState} state
 * @param {{ onAdvance:()=>void, onPause:()=>void }} handlers
 * @returns {() => void}  cleanup
 */
export function mountReveal(root, state, { onAdvance, onPause }) {
  clear(root);
  const category = categoriesForMode(state.mode)[state.round];
  const player = playerForMode(state.mode, state.reveal.playerId);
  const pauseBtn = makePauseBtn(onPause);

  const stage = el('div', { class: 'reel-stage' });
  const card = playerCard(player, { category });
  card.classList.add('card--locked');
  stage.append(card);

  const continueBtn = el('button', {
    class: 'btn btn--lock',
    text: `✅  Locked: ${player.short}`,
    attrs: { type: 'button' },
  });

  const screen = el('section', {
    class: 'screen play',
    style: { '--accent': category.accent },
    children: [
      progressBar(state, pauseBtn),
      categoryBanner(category),
      stage,
      continueBtn,
      slotTray(state),
    ],
  });
  root.append(screen);

  let advanced = false;
  const advance = () => {
    if (advanced) return;
    advanced = true;
    onAdvance();
  };
  const timer = window.setTimeout(advance, REVEAL_MS);

  continueBtn.addEventListener('click', () => {
    sfx.click();
    advance();
  });

  const onKey = (e) => {
    if (e.code === 'Escape') {
      e.preventDefault();
      onPause();
    } else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      advance();
    }
  };
  window.addEventListener('keydown', onKey);

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('keydown', onKey);
  };
}

// --- shared building blocks ------------------------------------------------

function makePauseBtn(onPause) {
  const btn = el('button', {
    class: 'iconbtn play__pause',
    text: '⏸',
    attrs: { type: 'button', 'aria-label': 'Pause' },
  });
  btn.addEventListener('click', () => {
    sfx.click();
    onPause();
  });
  return btn;
}

function progressBar(state, pauseBtn) {
  const categories = categoriesForMode(state.mode);
  const dots = categories.map((_, i) =>
    el('span', {
      class: ['dot', i < state.round ? 'dot--done' : i === state.round ? 'dot--active' : 'dot--todo'],
    })
  );
  return el('div', {
    class: 'progress',
    children: [
      el('div', {
        class: 'progress__left',
        children: [
          pauseBtn,
          el('div', { class: 'progress__label', text: `Round ${state.round + 1} of ${categories.length}` }),
        ],
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

function slotTray(state) {
  const categories = categoriesForMode(state.mode);
  const slots = categories.map((c, i) => {
    const pickedId = state.picks[c.id];
    const filled = Boolean(pickedId);
    return el('div', {
      class: ['slot', filled ? 'slot--filled' : i === state.round ? 'slot--active' : 'slot--empty'],
      attrs: { title: c.label },
      children: [
        el('span', { class: 'slot__icon', text: c.icon }),
        el('span', {
          class: 'slot__who',
          text: filled ? playerForMode(state.mode, pickedId).short : '—',
        }),
      ],
    });
  });
  return el('div', { class: 'tray', children: slots });
}
