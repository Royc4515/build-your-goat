// First-time interactive walkthrough. Instead of a wall of text, it renders a
// realistic (but static) play screen — a "fake real game" — and guides the
// player through it with spotlight coach-marks pointing at each piece of the HUD.
// Self-contained: mounts a full-screen overlay to <body>, cleans up on finish.

import { el } from './dom.js';
import { sfx } from './sound.js';
import { createMatch, lockPick, advanceAfterReveal, currentCategory } from '../engine/match/match.js';
import { categoriesForMode, playerForMode } from '../data/modes.js';
import { playerCard } from './playerCard.js';
import { poolMeter } from './hud/poolMeter.js';
import { powerUps } from './hud/powerUps.js';
import { buildProjection } from './hud/buildProjection.js';
import { rolesTracker } from './hud/rolesTracker.js';
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
    /* ignore */
  }
}

// Coach-mark steps: a selector into the demo screen + the copy to show.
const STEPS = [
  ['.cat-banner', '🏀 One skill at a time', "Each round you fill ONE of six skills. Right now it's Scoring."],
  ['.reel-stage .card__role', '⭐ Signature role', "Every player's badge shows their best skill — that's their role for team synergy."],
  ['.live-value', '🎯 Time your lock', 'Faces spin by fast. This big number is the on-screen player’s rating in the current skill — aim for a high one.'],
  ['.btn--lock', '🔒 Lock it in', 'Tap LOCK IN (or press Space) to grab whoever is on screen at that instant. Timing is the skill.'],
  ['.pool-meter', '🃏 Shared pool', 'Locked players leave the pool for good. In vs-CPU you can snipe a star before your opponent gets him.'],
  ['.powerups', '🔄 Power-ups', 'Freeze slows the reel for a precise lock. After you lock, Redo undoes the pick and re-spins that slot.'],
  ['.roles-tracker', '🏆 Cover the roles', 'Covering many DIFFERENT signature roles multiplies your score; roles no one covers cap it.'],
  ['.projection', '📈 Your projection', 'Your projected overall updates with every pick. Chase a perfect 99 and the GOAT tier!'],
];

/** Build a realistic mid-round solo state to render behind the coach-marks. */
function demoState() {
  let s = createMatch({ kind: 'solo', mode: 'nba-legends', seed: 246813, actors: ['human'] });
  // Lock two picks so the projection, roles tracker and pool meter look "live".
  s = advanceAfterReveal(lockPick(s, s.pool.available[0]));
  s = advanceAfterReveal(lockPick(s, s.pool.available[0]));
  return s;
}

/** Compose a static, non-interactive play screen from the real components. */
function demoScreen(state) {
  const mode = state.config.mode;
  const category = currentCategory(state);
  const categories = categoriesForMode(mode);
  const candidate = playerForMode(mode, state.pool.available[0]);

  const card = playerCard(candidate, { category, categories });
  card.classList.add('reel-card');
  const stage = el('div', { class: 'reel-stage', children: [card] });

  const banner = el('div', {
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

  const liveValue = el('div', {
    class: 'live-value',
    children: [
      el('span', { class: 'live-value__cap', text: `${category.icon} ${category.label}` }),
      el('span', { class: 'live-value__num tone--great', text: String(candidate.attrs[category.id] ?? 0) }),
    ],
  });

  const lockBtn = el('button', { class: 'btn btn--lock', text: '🔒  LOCK IN', attrs: { type: 'button' } });

  const screen = el('section', {
    class: 'screen play wt-demo',
    style: { '--accent': category.accent },
    children: [
      banner,
      poolMeter(state.pool.available.length, state.pool.order.length),
      stage,
      liveValue,
      lockBtn,
      powerUps({ economy: state.economy, frozen: false, allowFreeze: true }),
      buildProjection(state),
      rolesTracker(state),
    ],
  });
  return screen;
}

export function openTutorial(onClose) {
  sfx.click();

  const screen = demoScreen(demoState());
  const stageWrap = el('div', { class: 'wt-stage', children: [screen] });

  const spotlight = el('div', { class: 'wt-spotlight' });
  const tipTitle = el('div', { class: 'wt-tip__title' });
  const tipText = el('div', { class: 'wt-tip__text' });
  const tipStepNo = el('span', { class: 'wt-tip__step' });
  const backBtn = el('button', { class: 'btn btn--ghost wt-tip__btn', text: 'Back', attrs: { type: 'button' } });
  const nextBtn = el('button', { class: 'btn btn--primary wt-tip__btn', text: 'Next', attrs: { type: 'button' } });
  const skipBtn = el('button', { class: 'wt-skip', text: 'Skip ✕', attrs: { type: 'button' } });
  const tip = el('div', {
    class: 'wt-tip',
    attrs: { role: 'dialog', 'aria-modal': 'true' },
    children: [
      tipStepNo,
      tipTitle,
      tipText,
      el('div', { class: 'wt-tip__actions', children: [backBtn, nextBtn] }),
    ],
  });

  const overlay = el('div', {
    class: 'walkthrough',
    children: [stageWrap, spotlight, tip, skipBtn],
  });
  document.body.append(overlay);
  fitScreen(screen);

  let i = 0;

  const place = () => {
    const [selector] = STEPS[i];
    const target = screen.querySelector(selector) ?? screen;
    const r = target.getBoundingClientRect();
    const pad = 8;
    Object.assign(spotlight.style, {
      left: `${r.left - pad}px`,
      top: `${r.top - pad}px`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`,
    });
    // Tooltip: below the target if there's room, else above.
    const below = r.bottom + 12;
    const above = r.top - 12;
    const preferBelow = below < window.innerHeight - 180;
    tip.style.left = `${Math.max(12, Math.min(window.innerWidth - 332, r.left + r.width / 2 - 160))}px`;
    if (preferBelow) {
      tip.style.top = `${below}px`;
      tip.style.bottom = 'auto';
    } else {
      tip.style.top = 'auto';
      tip.style.bottom = `${window.innerHeight - above}px`;
    }
  };

  const render = () => {
    const [, title, text] = STEPS[i];
    tipStepNo.textContent = `Step ${i + 1} of ${STEPS.length}`;
    tipTitle.textContent = title;
    tipText.textContent = text;
    backBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = i === STEPS.length - 1 ? "Got it — let's play!" : 'Next';
    place();
  };

  const finish = () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    overlay.remove();
    markTutorialSeen();
    if (onClose) onClose();
  };

  const next = () => {
    if (i >= STEPS.length - 1) {
      finish();
      return;
    }
    sfx.click();
    i += 1;
    render();
  };
  const back = () => {
    if (i === 0) return;
    sfx.click();
    i -= 1;
    render();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      finish();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      back();
    }
  };
  const onResize = () => {
    fitScreen(screen);
    place();
  };

  nextBtn.addEventListener('click', next);
  backBtn.addEventListener('click', back);
  skipBtn.addEventListener('click', () => {
    sfx.click();
    finish();
  });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);

  // Defer first placement one frame so layout + fit have settled.
  requestAnimationFrame(render);
}
