// Static screen renderers: the intro/title screen and the final result screen.
// The live play rounds are handled separately in playScreen.js (they own a reel
// lifecycle). Each renderer clears the root and wires its own callbacks.

import { el, clear } from './dom.js';
import { playerCard } from './playerCard.js';
import { MODES, categoriesForMode, playerForMode } from '../data/modes.js';
import { scoreBuild } from '../engine/scoring/scoring.js';
import { matchWinner } from '../engine/match/match.js';
import { HUMAN } from '../engine/types.js';
import { sfx } from './sound.js';
import { openShareSheet } from './share.js';
import { openTutorial } from './tutorial.js';

/** Public URL players are pointed at when they share. */
const GAME_URL = 'https://royc4515.github.io/build-your-goat/';

/** Share payload for the game itself (intro screen). */
function gameSharePayload() {
  return {
    title: 'Build Your GOAT',
    text: '🐐 Build Your GOAT — spin legends & current stars across NBA, EuroLeague & Soccer into one ultimate team. Can you hit a perfect 99 OVR?',
    url: GAME_URL,
  };
}

/** Share payload summarising a finished build (result screen). */
function resultSharePayload(mode, picks, result) {
  const text = [
    `🐐 My GOAT — ${result.overall} OVR (${result.tier.label})`,
    `${MODES[mode].icon} ${MODES[mode].label}`,
    ...categoriesForMode(mode).map((c) => `${c.icon} ${c.label}: ${playerForMode(mode, picks[c.id]).name}`),
    ...(result.badges.length ? ['', result.badges.join('  ')] : []),
  ].join('\n');
  return { title: `My GOAT — ${result.overall} OVR`, text, url: GAME_URL };
}

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

  const share = el('button', { class: 'btn btn--ghost', text: '📤  Share' });
  share.addEventListener('click', () => openShareSheet(gameSharePayload()));

  const howto = el('button', { class: 'btn btn--ghost', text: '📖  How to Play' });
  howto.addEventListener('click', () => openTutorial());

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
        el('div', { class: 'intro__actions', children: [howto, settings, share] }),
      ],
    })
  );
}

/** Final reveal screen. Takes the finished match `state`. */
export function renderResult(root, { state, onPlayAgain, onChangeMode }) {
  clear(root);
  const mode = state.config.mode;
  const picks = state.boards[HUMAN];
  const result = scoreBuild(picks, mode);
  const categories = categoriesForMode(mode);
  const vsAI = state.config.actors.includes('cpu');
  sfx.reveal();

  const outcome = vsAI ? versusOutcome(state, result) : null;

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
      playerCard(playerForMode(mode, picks[c.id]), { category: c, categories, compact: true })
    ),
  });

  // vs-CPU: show the CPU's six picks too, so both teams can be compared.
  const cpuLineup = vsAI
    ? el('div', {
        class: 'lineup lineup--cpu',
        children: categories.map((c) =>
          playerCard(playerForMode(mode, state.boards.cpu[c.id]), { category: c, categories, compact: true }),
        ),
      })
    : null;
  const cpuHeading = vsAI
    ? el('h2', { class: 'lineup__heading lineup__heading--cpu', text: '🤖  CPU LINEUP' })
    : null;

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

  const share = el('button', { class: 'btn btn--primary btn--block', text: '📤  Share Result' });
  share.addEventListener('click', () => openShareSheet(resultSharePayload(mode, picks, result)));

  root.append(
    el('section', {
      class: 'screen result',
      children: [
        modeChip,
        outcome,
        el('div', { class: 'result__head', children: [ring, tier] }),
        breakdown,
        badges,
        el('h2', { class: 'lineup__heading', text: 'YOUR STARTING LINEUP' }),
        lineup,
        cpuHeading,
        cpuLineup,
        el('div', { class: 'result__actions', children: [again, change] }),
        share,
      ],
    })
  );
}

/** Win/lose banner + CPU score for a vs-AI match. */
function versusOutcome(state, humanResult) {
  const mode = state.config.mode;
  const cpuResult = scoreBuild(state.boards.cpu, mode);
  const winner = matchWinner(state);
  const verdict =
    winner === 'tie'
      ? { cls: 'outcome--tie', text: `🤝  Tie — ${humanResult.overall} all` }
      : winner === HUMAN
        ? { cls: 'outcome--win', text: `🏆  You win!  ${humanResult.overall} – ${cpuResult.overall}` }
        : { cls: 'outcome--lose', text: `😤  CPU wins  ${cpuResult.overall} – ${humanResult.overall}` };
  return el('div', { class: ['outcome', verdict.cls], text: verdict.text });
}
