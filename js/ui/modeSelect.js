// The mode-select screen: pick a sport + era to play. Reads the MODES registry
// and groups modes by sport. Picking a mode starts a game in it.

import { el, clear } from './dom.js';
import { MODES, MODE_IDS } from '../data/modes.js';
import { sfx } from './sound.js';

const SPORT_SECTIONS = [
  { sport: 'basketball', title: '🏀 Basketball' },
  { sport: 'soccer', title: '⚽ Soccer' },
];

/**
 * @param {HTMLElement} root
 * @param {{ onPick:(mode:string)=>void, onBack:()=>void }} handlers
 */
export function renderModeSelect(root, { onPick, onBack }) {
  clear(root);

  const back = el('button', { class: 'iconbtn settings__back', text: '←', attrs: { type: 'button', 'aria-label': 'Back' } });
  back.addEventListener('click', () => {
    sfx.click();
    onBack();
  });

  const modeCard = (id) => {
    const m = MODES[id];
    const card = el('button', {
      class: 'mode-card',
      attrs: { type: 'button' },
      children: [
        el('span', { class: 'mode-card__icon', text: m.icon }),
        el('span', { class: 'mode-card__label', text: m.label }),
        m.live ? el('span', { class: 'mode-card__live', text: 'LIVE' }) : null,
      ],
    });
    card.addEventListener('click', () => {
      sfx.click();
      onPick(id);
    });
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
    })
  );

  root.append(
    el('section', {
      class: 'screen modes',
      children: [
        el('div', {
          class: 'settings__head',
          children: [back, el('h1', { class: 'settings__title', text: 'Choose a Mode' })],
        }),
        ...sections,
      ],
    })
  );
}
