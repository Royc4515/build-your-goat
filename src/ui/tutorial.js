// First-time tutorial: welcome slides then a real guided game vs an easy CPU.
// The user plays the actual game mechanics while hints float at the bottom.
// Self-contained: mounts a full-screen overlay to <body>, cleans up on finish.

import { el, clear } from './dom.js';
import { sfx } from './sound.js';
import {
  createMatch,
  lockPick,
  advanceAfterReveal,
  resolveAITurn,
  isComplete,
  useFreeze,
  useReroll,
} from '../engine/match/match.js';
import { mountPlayRound, mountReveal, mountAIThinking } from './playScreen.js';
import { renderResult } from './screens.js';
import { policyFor } from '../engine/ai/policy.js';
import { fitScreen } from './fit.js';

const SEEN_KEY = 'byg:tutorialSeen';

export function hasSeenTutorial() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* noop */
  }
}

// ── Welcome slides ──────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: '🐐',
    title: 'Welcome to Build Your GOAT!',
    body: 'Assemble a 6-player dream team. Each slot covers a different skill — Scoring, Playmaking, Defense, and more. Your picks combine into one Overall rating out of 99.',
  },
  {
    icon: '🎰',
    title: 'Spin & Lock',
    body: "Player faces fly across the screen. The big number is their rating in the current skill. Tap LOCK IN the moment a high-rated player appears — timing is the skill.",
  },
  {
    icon: '🤖',
    title: 'Draft vs the CPU',
    body: "You and the CPU take turns picking. Once anyone locks a player they're gone from the shared pool. Snipe stars before the bot does — and cover more roles for a synergy bonus!",
  },
];

// ── Contextual hints ─────────────────────────────────────────────────────────

function hint(title, body) {
  return { title, body };
}

function hintFor(state) {
  const humanDone = Object.keys(state.boards?.human ?? {}).length;

  if (state.phase === 'aiThinking') {
    return hint('🤖 CPU is thinking…', "The bot is choosing. You're competing for the same pool — whatever it locks is gone.");
  }
  if (state.reveal?.actor === 'cpu') {
    return hint('🤖 CPU picked!', 'See what it drafted in the opponent tray. Your pick is next.');
  }
  if (state.reveal?.actor === 'human') {
    if (humanDone === 1) {
      return hint('✅ First pick!', "Nice! Watch the Roles Tracker — covering DIFFERENT signature roles multiplies your score.");
    }
    if (humanDone === 3) {
      return hint('🔄 Redo tip', "Changed your mind? Tap Redo on the reveal to un-pick and re-spin that slot. It costs a charge.");
    }
    return hint('✅ Locked in!', 'Tap Continue to move on. Your Overall projection updates with every pick.');
  }

  // Human spinning
  if (humanDone === 0) {
    return hint('🎯 Your first pick!', "The reel is spinning — that big number is the player's rating. Tap 🔒 LOCK IN when you see a high one!");
  }
  if (humanDone === 1) {
    return hint('🔄 Mix your roles', "Each player card shows a Signature Role badge. Picking DIFFERENT roles gives a synergy multiplier — diversify!");
  }
  if (humanDone === 2) {
    return hint('❄️ Try Freeze!', "Tap Freeze to slow the reel for a precise lock. Limited charges — use them on the skills you care most about.");
  }
  if (humanDone === 4) {
    return hint('🐐 Last pick!', "One slot left. Check the Projection — can you hit a high OVR? Make it count!");
  }
  return hint(`🏀 Pick ${humanDone + 1} of 6`, 'Keep building! Different signature roles = higher synergy bonus.');
}

// ── Main export ───────────────────────────────────────────────────────────────

export function openTutorial(onClose) {
  sfx.click();

  // Shell
  const gameRoot = el('div', { class: 'wt-game' });
  const hintTitle = el('p', { class: 'wt-hint__title' });
  const hintBody = el('p', { class: 'wt-hint__body' });
  const hintBox = el('div', { class: 'wt-hint', children: [hintTitle, hintBody] });
  const skipBtn = el('button', {
    class: 'wt-skip',
    text: 'Skip ✕',
    attrs: { type: 'button' },
  });

  const overlay = el('div', {
    class: 'walkthrough wt-guided',
    children: [gameRoot, hintBox, skipBtn],
  });
  document.body.append(overlay);

  let teardownRound = null;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    if (teardownRound) {
      teardownRound();
      teardownRound = null;
    }
    overlay.remove();
    markTutorialSeen();
    if (onClose) onClose();
  };

  skipBtn.addEventListener('click', () => {
    sfx.click();
    finish();
  });

  // ── Slides ──────────────────────────────────────────────────────────────────

  let slideIdx = 0;
  const slideIcon = el('div', { class: 'wt-slide__icon' });
  const slideTitle = el('h2', { class: 'wt-slide__title' });
  const slideBody = el('p', { class: 'wt-slide__body' });
  const dots = SLIDES.map(() => el('span', { class: 'wt-dot' }));
  const backBtn = el('button', { class: 'btn btn--ghost', text: '← Back', attrs: { type: 'button' } });
  const nextBtn = el('button', { class: 'btn btn--primary', text: 'Next →', attrs: { type: 'button' } });

  const renderSlide = () => {
    const s = SLIDES[slideIdx];
    slideIcon.textContent = s.icon;
    slideTitle.textContent = s.title;
    slideBody.textContent = s.body;
    dots.forEach((d, i) => {
      d.className = 'wt-dot' + (i === slideIdx ? ' wt-dot--active' : '');
    });
    backBtn.style.visibility = slideIdx === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = slideIdx === SLIDES.length - 1 ? "Let's Play! 🏀" : 'Next →';
  };

  nextBtn.addEventListener('click', () => {
    sfx.click();
    if (slideIdx < SLIDES.length - 1) {
      slideIdx++;
      renderSlide();
    } else {
      startGame();
    }
  });
  backBtn.addEventListener('click', () => {
    if (slideIdx > 0) {
      sfx.click();
      slideIdx--;
      renderSlide();
    }
  });

  gameRoot.append(
    el('div', {
      class: 'wt-slides',
      children: [
        slideIcon,
        slideTitle,
        slideBody,
        el('div', { class: 'wt-dots', children: dots }),
        el('div', { class: 'wt-slide__actions', children: [backBtn, nextBtn] }),
      ],
    })
  );
  renderSlide();

  // ── Live guided game ─────────────────────────────────────────────────────────

  function startGame() {
    clear(gameRoot);
    gameRoot.classList.add('wt-game--playing');
    hintBox.classList.add('wt-hint--visible');

    let state = createMatch({
      kind: 'vsAI',
      mode: 'nba-legends',
      seed: 54321,
      actors: ['human', 'cpu'],
      policy: policyFor('rookie'),
    });

    const setHint = ({ title, body }) => {
      hintTitle.textContent = title;
      hintBody.textContent = body;
    };

    const step = (nextState) => {
      state = nextState;
      if (teardownRound) {
        teardownRound();
        teardownRound = null;
      }

      if (isComplete(state)) {
        setHint(hint('🐐 You built your GOAT!', "That's your Overall rating! Synergy from different roles boosted your score."));
        renderResult(gameRoot, {
          state,
          onPlayAgain: finish,
          onChangeMode: finish,
        });
        // Promote hint box into a CTA
        const playBtn = el('button', {
          class: 'btn btn--primary',
          text: '🐐 Play for Real!',
          attrs: { type: 'button' },
        });
        playBtn.addEventListener('click', () => {
          sfx.click();
          finish();
        });
        hintBox.append(playBtn);
        hintBox.style.pointerEvents = 'auto';
        fitScreen(gameRoot.querySelector('.screen'));
        return;
      }

      setHint(hintFor(state));

      if (state.phase === 'aiThinking') {
        teardownRound = mountAIThinking(gameRoot, state, {
          onResolved: () => step(resolveAITurn(state)),
          onPause: () => {},
          onBack: finish,
        });
      } else if (state.reveal) {
        teardownRound = mountReveal(gameRoot, state, {
          onAdvance: () => step(advanceAfterReveal(state)),
          onPause: () => {},
          onBack: finish,
          onReroll: () => step(useReroll(state)),
        });
      } else {
        teardownRound = mountPlayRound(gameRoot, state, {
          onLocked: (id) => step(lockPick(state, id)),
          onPause: () => {},
          onBack: finish,
          onFreeze: () => step(useFreeze(state)),
        });
      }
      fitScreen(gameRoot.querySelector('.screen'));
    };

    step(state);
  }
}
