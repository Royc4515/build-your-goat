// Renders the live views of a match round:
//   mountPlayRound  — the human's spinning reel + LOCK IN (timing = skill).
//   mountReveal     — shows a just-locked pick (human: manual Continue;
//                     CPU: labelled + auto-advances after a beat).
//   mountAIThinking — a brief "CPU is drafting…" view; resolves the AI turn.
// All read the active mode (state.config.mode) and the per-actor boards, so the
// same screens play solo and vs-AI. Each returns a cleanup the caller MUST run.

import { el, clear } from './dom.js';
import { currentCategory, currentTurn, firstPicker } from '../engine/match/match.js';
import { HUMAN } from '../engine/types.js';
import { categoriesForMode, playerForMode } from '../data/modes.js';
import { createReel } from './reel.js';
import { playerCard } from './playerCard.js';
import { poolMeter } from './hud/poolMeter.js';
import { powerUps } from './hud/powerUps.js';
import { buildProjection } from './hud/buildProjection.js';
import { rolesTracker } from './hud/rolesTracker.js';
import { opponentTray } from './hud/opponentTray.js';
import { sfx } from './sound.js';

const AI_REVEAL_MS = 1100; // how long the CPU's pick is shown before advancing
const AI_THINK_MS = 700; // brief pause so the CPU "taking" a pick is legible

const hasOpponent = (state) => state.config.actors.length > 1;
const humanBoard = (state) => state.boards[HUMAN] ?? {};

/**
 * Mount the human's spinning round.
 * @returns {() => void} cleanup
 */
export function mountPlayRound(root, state, { onLocked, onPause, onBack, onFreeze }) {
  clear(root);
  const category = currentCategory(state);
  const categories = categoriesForMode(state.config.mode);
  const stage = el('div', { class: 'reel-stage' });

  // Live value of the player currently on the reel, in the active skill — so you
  // can time the lock for a high one.
  const liveNum = el('span', { class: 'live-value__num', text: '—' });
  const liveValue = el('div', {
    class: 'live-value',
    children: [el('span', { class: 'live-value__cap', text: `${category.icon} ${category.label}` }), liveNum],
  });

  const lockBtn = el('button', { class: 'btn btn--lock', text: '🔒  LOCK IN', attrs: { type: 'button' } });

  const screen = el('section', {
    class: 'screen play',
    style: { '--accent': category.accent },
    children: [
      progressBar(state, [makeBackBtn(onBack), makePauseBtn(onPause)]),
      turnBanner(state),
      tossNote(state),
      categoryBanner(category),
      poolMeter(state.pool.available.length, state.pool.order.length),
      stage,
      liveValue,
      lockBtn,
      powerUps({ economy: state.economy, frozen: state.frozen, allowFreeze: true, onFreeze }),
      buildProjection(state),
      rolesTracker(state),
      opponentBlock(state),
      slotTray(state),
    ],
  });
  root.append(screen);

  const reel = createReel({
    mount: stage,
    category,
    categories,
    pool: state.pool.available.map((id) => playerForMode(state.config.mode, id)),
    frozen: state.frozen,
    onSettled: (player) => onLocked(player.id),
    onTick: (player) => {
      liveNum.textContent = String(player.attrs[category.id] ?? 0);
      liveNum.className = 'live-value__num ' + ratingTone(player.attrs[category.id] ?? 0);
    },
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
export function mountReveal(root, state, { onAdvance, onPause, onBack, onReroll }) {
  clear(root);
  const reveal = state.reveal;
  const isCpu = reveal.actor === 'cpu';
  const category = categoriesForMode(state.config.mode).find((c) => c.id === reveal.categoryId);
  if (!category) throw new Error(`mountReveal: unknown category '${reveal.categoryId}'`);
  const player = playerForMode(state.config.mode, reveal.playerId);
  const isLastTurn = state.cursor + 1 >= state.draftOrder.length;

  const stage = el('div', { class: 'reel-stage' });
  const card = playerCard(player, { category, categories: categoriesForMode(state.config.mode) });
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
    // Redo: undo this pick and re-spin the slot (spends a reroll).
    children.push(
      powerUps({ economy: state.economy, frozen: false, allowReroll: true, onReroll }),
    );
  }

  children.push(buildProjection(state), rolesTracker(state), opponentBlock(state), slotTray(state));
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
      tossNote(state),
      categoryBanner(category),
      el('div', { class: 'thinking', children: [el('div', { class: 'thinking__face', text: '🤖' }), el('div', { class: 'thinking__label', text: 'CPU is drafting' }), dots] }),
      buildProjection(state),
      rolesTracker(state),
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

/** Color tone for the live pick value, mirroring the card stat tiers. */
function ratingTone(v) {
  if (v >= 95) return 'tone--elite';
  if (v >= 88) return 'tone--great';
  if (v >= 80) return 'tone--good';
  return 'tone--ok';
}

/** One-time coin-flip result, shown until the human makes their first lock (so
 *  it's visible whether the human or the CPU won the toss). */
function tossNote(state) {
  const humanPicked = Object.keys(state.boards[HUMAN] ?? {}).length > 0;
  if (!hasOpponent(state) || state.config.kind === 'hotseat' || humanPicked) return el('span', { class: 'toss-spacer' });
  const youFirst = firstPicker(state) === HUMAN;
  return el('div', {
    class: ['toss-note', youFirst ? 'toss-note--me' : 'toss-note--cpu'],
    text: youFirst ? '🪙 You won the toss — you pick first' : '🪙 CPU won the toss — it picks first',
  });
}

/** Whose turn it is — only meaningful in a competitive match. */
function turnBanner(state) {
  if (!hasOpponent(state)) return el('span', { class: 'turn-spacer' });
  const turn = currentTurn(state);
  const isHotseat = state.config.kind === 'hotseat';
  if (isHotseat) {
    const isP1 = turn?.actor === HUMAN;
    return el('div', {
      class: ['turn-banner', isP1 ? 'turn-banner--me' : 'turn-banner--cpu'],
      text: isP1 ? '🧑  Player 1' : '🧑‍🤝‍🧑  Player 2',
    });
  }
  const mine = turn?.actor === HUMAN;
  return el('div', {
    class: ['turn-banner', mine ? 'turn-banner--me' : 'turn-banner--cpu'],
    text: mine ? '🧑  Your pick' : '🤖  CPU picking',
  });
}

/** Opponent status block (only in vs-AI; hidden in hotseat to keep boards private). */
function opponentBlock(state) {
  if (!hasOpponent(state) || state.config.kind === 'hotseat') return el('span', { class: 'opp-spacer' });
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

/**
 * Hotseat interstitial: shown between turns so each player can't see the other's pick.
 * @returns {() => void} cleanup
 */
export function mountPassDevice(root, actorId, { onReady }) {
  clear(root);
  const isP2 = actorId === 'human2';
  const label = isP2 ? 'Player 2' : 'Player 1';
  const emoji = isP2 ? '🧑‍🤝‍🧑' : '🧑';

  const readyBtn = el('button', {
    class: 'btn btn--primary btn--xl',
    text: `${emoji}  ${label} — I'm ready!`,
    attrs: { type: 'button' },
  });
  readyBtn.addEventListener('click', () => {
    sfx.click();
    onReady();
  });

  const screen = el('section', {
    class: 'screen play pass-device',
    children: [
      el('div', { class: 'pass-device__body', children: [
        el('div', { class: 'pass-device__emoji', text: emoji }),
        el('h2', { class: 'pass-device__title', text: `${label}'s turn` }),
        el('p', { class: 'pass-device__hint', text: 'Pass the device — tap when ready to pick.' }),
        readyBtn,
      ]}),
    ],
  });
  root.append(screen);

  const onKey = (e) => {
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); sfx.click(); onReady(); }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
