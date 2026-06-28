// The mode-select screen: choose an opponent (Solo or vs CPU + difficulty), then
// a sport + era. Picking a mode starts a match with that opponent. Modes whose
// roster is too small for a 2-player shared draft are disabled in vs-CPU.

import { el, clear } from './dom.js';
import { MODES, MODE_IDS, supportsActors } from '../data/modes.js';
import { sfx } from './sound.js';
import { todayUTC, dailyNumber } from '../engine/daily/daily.js';
import { hasPlayedToday, getStreak } from '../persistence/streak.js';

const SPORT_SECTIONS = [
  { sport: 'basketball', title: '🏀 Basketball' },
  { sport: 'soccer', title: '⚽ Soccer' },
];

const DIFFICULTIES = [
  { id: 'rookie', label: 'Rookie' },
  { id: 'pro', label: 'Pro' },
  { id: 'allstar', label: 'All-Star' },
];

/**
 * @param {HTMLElement} root
 * @param {{ onPick:(mode:string, opp:{vsAI:boolean,isDaily:boolean,difficulty:string})=>void, onBack:()=>void }} handlers
 */
export function renderModeSelect(root, { onPick, onBack }) {
  // Local selection state; re-paints the screen when it changes.
  const sel = { vsAI: false, difficulty: 'pro' };

  const paint = () => {
    clear(root);

    const today = todayUTC();
    const played = hasPlayedToday(today);
    const streak = getStreak();
    const dayNum = dailyNumber(today);

    const back = el('button', {
      class: 'iconbtn settings__back',
      text: '←',
      attrs: { type: 'button', 'aria-label': 'Back' },
    });
    back.addEventListener('click', () => {
      sfx.click();
      onBack();
    });

    const opponent = segmented(
      [
        { id: 'solo', label: '🧍 Solo' },
        { id: 'vs', label: '🤖 vs CPU' },
      ],
      sel.vsAI ? 'vs' : 'solo',
      (id) => {
        sel.vsAI = id === 'vs';
        paint();
      },
    );

    const difficulty = sel.vsAI
      ? el('div', {
          class: 'opp-config',
          children: [
            el('span', { class: 'opp-config__label', text: 'Difficulty' }),
            segmented(DIFFICULTIES, sel.difficulty, (id) => {
              sel.difficulty = id;
              paint();
            }),
          ],
        })
      : null;

    const modeCard = (id) => {
      const m = MODES[id];
      const disabled = sel.vsAI && !supportsActors(id, 2);
      const card = el('button', {
        class: ['mode-card', disabled ? 'mode-card--disabled' : ''],
        attrs: { type: 'button', ...(disabled ? { title: 'Roster too small for vs CPU' } : {}) },
        children: [
          el('span', { class: 'mode-card__icon', text: m.icon }),
          el('span', { class: 'mode-card__label', text: m.label }),
          m.live ? el('span', { class: 'mode-card__live', text: 'LIVE' }) : null,
          disabled ? el('span', { class: 'mode-card__note', text: 'roster too small' }) : null,
        ],
      });
      card.disabled = disabled;
      if (!disabled) {
        card.addEventListener('click', () => {
          sfx.click();
          onPick(id, { vsAI: sel.vsAI, isDaily: false, difficulty: sel.difficulty });
        });
      }
      return card;
    };

    const sections = SPORT_SECTIONS.map(({ sport, title }) =>
      el('div', {
        class: 'modes__section',
        children: [
          el('div', { class: 'modes__section-title', text: title }),
          el('div', {
            class: 'modes__grid',
            children: MODE_IDS.filter((id) => MODES[id].sport === sport).map(modeCard),
          }),
        ],
      }),
    );

    const dailyBtn = el('button', {
      class: ['daily-btn', played ? 'daily-btn--done' : ''],
      attrs: { type: 'button' },
      children: [
        el('div', {
          class: 'daily-btn__top',
          children: [
            el('span', { class: 'daily-btn__label', text: `📅  Daily #${dayNum}` }),
            played ? el('span', { class: 'daily-btn__badge', text: '✓ Done' }) : null,
          ],
        }),
        el('div', {
          class: 'daily-btn__sub',
          text: streak.current > 0
            ? `🔥 ${streak.current} day streak — play today's challenge`
            : 'Play today\'s challenge',
        }),
      ],
    });
    dailyBtn.addEventListener('click', () => {
      sfx.click();
      onPick('nba-legends', { vsAI: false, isDaily: true, difficulty: 'pro' });
    });

    root.append(
      el('section', {
        class: 'screen modes',
        children: [
          el('div', {
            class: 'settings__head',
            children: [back, el('h1', { class: 'settings__title', text: 'Choose a Mode' })],
          }),
          dailyBtn,
          el('div', { class: 'opp-picker', children: [opponent, difficulty] }),
          ...sections,
        ],
      }),
    );
  };

  paint();
}

/** A small segmented control; calls onPick(id) when a segment is chosen. */
function segmented(options, activeId, onPickSeg) {
  return el('div', {
    class: 'segmented',
    children: options.map((o) => {
      const btn = el('button', {
        class: ['segmented__opt', o.id === activeId ? 'segmented__opt--active' : ''],
        text: o.label,
        attrs: { type: 'button' },
      });
      btn.addEventListener('click', () => {
        sfx.click();
        onPickSeg(o.id);
      });
      return btn;
    }),
  });
}
