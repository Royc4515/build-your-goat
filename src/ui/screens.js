// Static screen renderers: the intro/title screen and the final result screen.
// The live play rounds are handled separately in playScreen.js (they own a reel
// lifecycle). Each renderer clears the root and wires its own callbacks.

import { el, clear } from './dom.js';
import { playerCard } from './playerCard.js';
import { MODES, categoriesForMode, playerForMode } from '../data/modes.js';
import { scoreBuild } from '../engine/scoring/scoring.js';
import { sfx } from './sound.js';

/** Title screen. */
export function renderIntro(root, { onStart, onSettings }) {
  clear(root);

  const steps = [
    ['🎮', 'Pick a mode', 'NBA, EuroLeague or Soccer — legends, current stars, or the World Cup.'],
    ['🎰', 'Spin & lock', 'Faces fly by for each skill — tap LOCK on the one you want. Timing is everything.'],
    ['🐐', 'Reveal your GOAT', 'Six picks combine into one rating. Chase the perfect 99.'],
  ].map(([icon, title, desc]) =>
    el('li', {
      class: 'how__item',
      children: [
        el('span', { class: 'how__icon', text: icon }),
        el('div', {
          children: [
            el('div', { class: 'how__title', text: title }),
            el('div', { class: 'how__desc', text: desc }),
          ],
        }),
      ],
    })
  );

  const start = el('button', { class: 'btn btn--primary btn--xl', text: '▶  START BUILDING' });
  start.addEventListener('click', () => {
    sfx.click();
    onStart();
  });

  const settings = el('button', { class: 'btn btn--ghost', text: '⚙  Settings' });
  settings.addEventListener('click', () => {
    sfx.click();
    onSettings();
  });

  root.append(
    el('section', {
      class: 'screen intro',
      children: [
        el('div', { class: 'intro__badge', text: '🏀 ⚽ MULTI-SPORT' }),
        el('h1', {
          class: 'title',
          children: [
            el('span', { class: 'title__line1', text: 'BUILD YOUR' }),
            el('span', { class: 'title__goat', text: 'G🐐AT' }),
          ],
        }),
        el('p', { class: 'subtitle', text: 'Six skills. One legend. Spin, lock, and reveal the greatest of all time you can assemble.' }),
        el('ul', { class: 'how', children: steps }),
        start,
        settings,
      ],
    })
  );
}

/** Final reveal screen. */
export function renderResult(root, { mode, picks, onPlayAgain, onChangeMode }) {
  clear(root);
  const result = scoreBuild(picks, mode);
  const categories = categoriesForMode(mode);
  sfx.reveal();

  const ring = el('div', {
    class: 'overall',
    style: { '--pct': String(result.overall) },
    children: [
      el('div', { class: 'overall__num', text: String(result.overall) }),
      el('div', { class: 'overall__cap', text: 'OVR' }),
    ],
  });

  const tier = el('div', {
    class: 'tier',
    children: [
      el('div', { class: 'tier__name', text: `${result.tier.emoji} ${result.tier.label}` }),
      el('div', { class: 'tier__blurb', text: result.tier.blurb }),
    ],
  });

  const modeChip = el('div', {
    class: 'result__mode',
    text: `${MODES[mode].icon} ${MODES[mode].label}`,
  });

  const synergyText =
    result.chemistry > 0
      ? `  +${result.chemistry} synergy`
      : result.chemistry < 0
        ? `  ${result.chemistry} (roles missing)`
        : '';
  const breakdown = el('div', {
    class: 'breakdown',
    text: `Base ${result.base}${synergyText}  ·  ${result.synergy.rolesCovered}/${categories.length} roles covered`,
  });

  const badges = el('div', {
    class: 'badges',
    children: result.badges.map((b) => el('span', { class: 'badge', text: b })),
  });

  const lineup = el('div', {
    class: 'lineup',
    children: categories.map((c) =>
      playerCard(playerForMode(mode, picks[c.id]), { category: c, compact: true })
    ),
  });

  const again = el('button', { class: 'btn btn--primary', text: '🔁  Play Again' });
  again.addEventListener('click', () => {
    sfx.click();
    onPlayAgain();
  });

  const change = el('button', { class: 'btn btn--ghost', text: '🎮  Change Mode' });
  change.addEventListener('click', () => {
    sfx.click();
    onChangeMode();
  });

  const share = el('button', { class: 'btn btn--ghost btn--block', text: '📋  Copy Result' });
  share.addEventListener('click', () => copyResult(share, mode, picks, result));

  root.append(
    el('section', {
      class: 'screen result',
      children: [
        modeChip,
        el('div', { class: 'result__head', children: [ring, tier] }),
        breakdown,
        badges,
        el('h2', { class: 'lineup__heading', text: 'YOUR STARTING LINEUP' }),
        lineup,
        el('div', { class: 'result__actions', children: [again, change] }),
        share,
      ],
    })
  );
}

/** Copy a plain-text summary to the clipboard with graceful fallback. */
function copyResult(button, mode, picks, result) {
  sfx.click();
  const lines = [
    `🐐 MY GOAT — ${result.overall} OVR (${result.tier.label})`,
    `${MODES[mode].icon} ${MODES[mode].label}`,
    ...categoriesForMode(mode).map((c) => `${c.icon} ${c.label}: ${playerForMode(mode, picks[c.id]).name}`),
    ...(result.badges.length ? ['', result.badges.join('  ')] : []),
    '',
    'Build yours: https://royc4515.github.io/build-your-goat/',
  ];
  const text = lines.join('\n');

  const flash = (msg) => {
    const original = '📋  Copy Result';
    button.textContent = msg;
    window.setTimeout(() => (button.textContent = original), 1600);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => flash('✅  Copied!')).catch(() => flash('⚠️  Copy failed'));
  } else {
    flash('⚠️  Not supported');
  }
}
