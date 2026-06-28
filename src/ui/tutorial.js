// First-time "How to Play" overlay. Self-contained: mounts to <body>, closes on
// the button, backdrop click, or Escape. A localStorage flag makes it auto-open
// once; the intro screen's "How to Play" button can reopen it anytime.

import { el } from './dom.js';
import { sfx } from './sound.js';

const SEEN_KEY = 'byg:tutorialSeen';

export function hasSeenTutorial() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

const STEPS = [
  ['🎰', 'Spin & lock', 'For each of the 6 skills, faces fly by on the reel. Tap LOCK IN (or Space) to grab whoever is on screen — timing is the skill. The live number shows their rating in that skill.'],
  ['🃏', 'Shared pool', 'Once a player is locked they leave the pool for good — so your six picks are all different, and in vs-CPU you can snipe a star before the CPU gets him.'],
  ['🏆', 'Cover the roles', "Each player has a signature role (their best skill — shown on the card). Covering many different roles multiplies your score; leaving roles empty caps it. The “Roles x/6” tracker shows your progress."],
  ['🔄', 'Power-ups', 'Reroll reshuffles which faces appear; Freeze slows the reel for one precise lock. Both are scarce — spend them when it counts.'],
  ['🤖', 'vs CPU', 'A coin flip decides who drafts first, then you alternate from the same pool. Build a higher-rated team than the CPU to win.'],
];

export function openTutorial(onClose) {
  sfx.click();

  const close = () => {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
    markTutorialSeen();
    if (onClose) onClose();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const steps = STEPS.map(([icon, title, desc]) =>
    el('li', {
      class: 'tut__item',
      children: [
        el('span', { class: 'tut__icon', text: icon }),
        el('div', {
          children: [
            el('div', { class: 'tut__title', text: title }),
            el('div', { class: 'tut__desc', text: desc }),
          ],
        }),
      ],
    }),
  );

  const gotIt = el('button', { class: 'btn btn--primary btn--block', text: "Got it — let's play" });
  gotIt.addEventListener('click', () => {
    sfx.click();
    close();
  });

  const card = el('div', {
    class: 'tut__card',
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'How to play' },
    children: [
      el('h2', { class: 'tut__heading', text: '🐐  How to Play' }),
      el('ul', { class: 'tut__list', children: steps }),
      gotIt,
    ],
  });

  const overlay = el('div', { class: 'tut', children: [card] });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('keydown', onKey);
  document.body.append(overlay);
}
