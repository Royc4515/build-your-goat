// Renders the live views of a match round:
//   mountPlayRound  — the human's spinning reel + LOCK IN (timing = skill).
//   mountReveal     — shows a just-locked pick (human: manual Continue;
//                     CPU: labelled + auto-advances after a beat).
//   mountAIThinking — a brief "CPU is drafting…" view; resolves the AI turn.
// All read the active mode (state.config.mode) and the per-actor boards, so the
// same screens play solo and vs-AI. Each returns a cleanup the caller MUST run.

import { el, clear } from './dom.js';
import { currentCategory, currentTurn } from '../engine/match/match.js';
import { HUMAN } from '../engine/types.js';
import { categoriesForMode, playerForMode } from '../data/modes.js';
import { createReel } from './reel.js';
import { playerCard } from './playerCard.js';
import { poolMeter } from './hud/poolMeter.js';
import { powerUps } from './hud/powerUps.js';
import { buildProjection } from './hud/buildProjection.js';
import { opponentTray } from './hud/opponentTray.js';
import { sfx } from './sound.js';

const AI_REVEAL_MS = 1100; // how long the CPU's pick is shown before advancing
const AI_THINK_MS = 700; // brief pause so the CPU "taking" a pick is legible

const hasOpponent = (state) => state.config.actors.includes('cpu');
const humanBoard = (state) => state.boards[HUMAN] ?? {};

/**
 * Mount the human's spinning round.
 * @returns {() => void} cleanup
 */
export function mountPlayRound(root, state, { onLocked, onPause, onBack, onReroll, onFreeze }) {
  clear(root);
  const category = currentCategory(state);
  const stage = el('div', { class: 'reel-stage' });

  const lockBtn = el('button', { class: 'btn btn--lock', text: '🔒  LOCK IN', attrs: { type: 'button' } });

  const screen = el('section', {
    class: 'screen play',
    style: { '--accent': category.accent },
    children: [
      progressBar(state, [makeBackBtn(onBack), makePauseBtn(onPause)]),
      turnBanner(state),
      categoryBanner(category),
      poolMeter(state.pool.available.length, state.pool.order.length),
      stage,
      lockBtn,
      powerUps({ economy: state.economy, frozen: state.frozen, onReroll, onFreeze }),
      buildProjection(state),
      opponentBlock(state),
      slotTray(state),
    ],
  });
  root.append(screen);

  const reel = createReel({
    mount: stage,
    category,
    pool: state.pool.available.map((id) => playerForMode(state.config.mode, id)),
    frozen: state.frozen,
    onSettled: (player) => onLocked(player.id),
  });

  const onLockClick = () => {
    if (reel.isLocking()) return;
    reel.lock();
  };
  lockBtn.addEventListener('click', onLockClick);

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
 * Mount the reveal of a just-locked pick. Human picks wait for Continue; CPU
 * picks are labelled and auto-advance after a beat.
 * @returns {() => void} cleanup
 */
export function mountReveal(root, state, { onAdvance, onPause, onBack }) {
  clear(root);
  const reveal = state.reveal;
  const isCpu = reveal.actor === 'cpu';
  const category = categoriesForMode(state.config.mode).find((c) => c.id === reveal.categoryId);
  const player = playerForMode(state.config.mode, reveal.playerId);
  const isLastTurn = state.cursor + 1 >= state.draftOrder.length;

  const stage = el('div', { class: 'reel-stage' });
  const card = playerCard(player, { category });
  card.classList.add('card--locked');
  stage.append(card);

  const locked = el('div', {
    class: ['reveal-tag', isCpu ? 'reveal-tag--cpu' : ''],
    text: isCpu ? `🤖  CPU drafted ${player.short}` : `✅  ${player.short} locked in`,
  });

  const children = [
    progressBar(state, [makeBackBtn(onBack), makePauseBtn(onPause)]),
    turnBanner(state),
    categoryBanner(category),
    stage,
    locked,
  ];

  let advanced = false;
  let timer = null;
  const advance = () => {
    if (advanced) return;
    advanced = true;
    onAdvance();
  };

  if (isCpu) {
    children.push(el('div', { class: 'reveal-hint', text: 'Your pick next…' }));
    timer = window.setTimeout(advance, AI_REVEAL_MS);
  } else {
    const continueBtn = el('button', {
      class: 'btn btn--lock',
      text: isLastTurn ? '🐐  See Results' : 'Next  ▶',
      attrs: { type: 'button' },
    });
    continueBtn.addEventListener('click', () => {
      sfx.click();
      advance();
    });
    children.push(continueBtn);
  }

  children.push(buildProjection(state), opponentBlock(state), slotTray(state));
  root.append(el('section', { class: 'screen play', style: { '--accent': category.accent }, children }));

  const onKey = (e) => {
    if (e.code === 'Escape') {
      e.preventDefault();
      onPause();
    } else if (!isCpu && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      advance();
    }
  };
  window.addEventListener('keydown', onKey);

  return () => {
    if (timer) window.clearTimeout(timer);
    window.removeEventListener('keydown', onKey);
  };
}

/**
 * Mount the "CPU is drafting" interlude, then resolve the AI turn.
 * @returns {() => void} cleanup
 */
export function mountAIThinking(root, state, { onResolved, onPause, onBack }) {
  clear(root);
  const category = currentCategory(state);

  const dots = el('div', { class: 'thinking__dots', children: ['', '', ''].map(() => el('span')) });
  const screen = el('section', {
    class: 'screen play',
    style: { '--accent': category.accent },
    children: [
      progressBar(state, [makeBackBtn(onBack), makePauseBtn(onPause)]),
      turnBanner(state),
      categoryBanner(category),
      el('div', { class: 'thinking', children: [el('div', { class: 'thinking__face', text: '🤖' }), el('div', { class: 'thinking__label', text: 'CPU is drafting' }), dots] }),
      buildProjection(state),
      opponentBlock(state),
      slotTray(state),
    ],
  });
  root.append(screen);

  const timer = window.setTimeout(onResolved, AI_THINK_MS);
  return () => window.clearTimeout(timer);
}

// --- shared building blocks ------------------------------------------------

function makePauseBtn(onPause) {
  const btn = el('button', { class: 'iconbtn play__pause', text: '⏸', attrs: { type: 'button', 'aria-label': 'Pause' } });
  btn.addEventListener('click', () => {
    sfx.click();
    onPause();
  });
  return btn;
}

function makeBackBtn(onBack) {
  const btn = el('button', { class: 'iconbtn play__back', text: '←', attrs: { type: 'button', 'aria-label': 'Back to mode menu' } });
  btn.addEventListener('click', () => {
    sfx.click();
    onBack();
  });
  return btn;
}

/** Whose turn it is — only meaningful in a competitive match. */
function turnBanner(state) {
  if (!hasOpponent(state)) return el('span', { class: 'turn-spacer' });
  const turn = currentTurn(state);
  const mine = turn?.actor === HUMAN;
  return el('div', {
    class: ['turn-banner', mine ? 'turn-banner--me' : 'turn-banner--cpu'],
    text: mine ? '🧑  Your pick' : '🤖  CPU picking',
  });
}

/** Opponent status block (only in vs-AI). */
function opponentBlock(state) {
  if (!hasOpponent(state)) return el('span', { class: 'opp-spacer' });
  return opponentTray(state, 'cpu', '🤖 CPU');
}

function progressBar(state, controls) {
  const categories = categoriesForMode(state.config.mode);
  const board = humanBoard(state);
  const activeId = currentTurn(state)?.actor === HUMAN ? currentCategory(state)?.id : null;
  const dots = categories.map((c) =>
    el('span', {
      class: ['dot', board[c.id] ? 'dot--done' : c.id === activeId ? 'dot--active' : 'dot--todo'],
    }),
  );
  const filled = categories.filter((c) => board[c.id]).length;
  return el('div', {
    class: 'progress',
    children: [
      el('div', {
        class: 'progress__left',
        children: [...controls, el('div', { class: 'progress__label', text: `Pick ${Math.min(filled + 1, categories.length)} of ${categories.length}` })],
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
  const categories = categoriesForMode(state.config.mode);
  const board = humanBoard(state);
  const activeId = currentTurn(state)?.actor === HUMAN ? currentCategory(state)?.id : null;
  const slots = categories.map((c) => {
    const pickedId = board[c.id];
    const filled = Boolean(pickedId);
    return el('div', {
      class: ['slot', filled ? 'slot--filled' : c.id === activeId ? 'slot--active' : 'slot--empty'],
      attrs: { title: c.label },
      children: [
        el('span', { class: 'slot__icon', text: c.icon }),
        el('span', { class: 'slot__who', text: filled ? playerForMode(state.config.mode, pickedId).short : '—' }),
      ],
    });
  });
  return el('div', { class: 'tray', children: slots });
}
