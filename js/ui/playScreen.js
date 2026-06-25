// Renders the two states of an active round:
//   mountPlayRound — the spinning reel + LOCK IN. Pressing lock captures the
//     face on screen at that instant (skill, not luck) and commits it.
//   mountReveal    — shows the just-locked pick for a beat before advancing.
// Both carry a pause button that works at all times. Each returns a cleanup
// function the caller MUST run before mounting the next view.

import { el, clear } from './dom.js';
import { CATEGORIES, TOTAL_ROUNDS } from '../data/categories.js';
import { PLAYERS, PLAYERS_BY_ID } from '../data/players.js';
import { currentCategory } from '../core/state.js';
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
  const category = CATEGORIES[state.round];
  const player = PLAYERS_BY_ID[state.reveal.playerId];
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
      progressBar(state.round, pauseBtn),
      categoryBanner(category),
      stage,
      continueBtn,
      slotTray(state.picks, state.round),
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
