// Renders a single player "card" used in the reel and the result lineup.
// The art is pure CSS: a team-colored jersey panel with monogram + number,
// so there are no image files to load or break.

import { el } from './dom.js';
import { headshotUrl, hasHeadshot } from '../data/headshots.js';
import { getSetting } from '../core/settings.js';

/** Map a 0-99 rating to a label tier for color coding. */
function ratingClass(value) {
  if (value >= 95) return 'rating--elite';
  if (value >= 88) return 'rating--great';
  if (value >= 80) return 'rating--good';
  return 'rating--ok';
}

/**
 * Build a player card.
 * @param {import('../data/players.js').Player} player
 * @param {Object} [opts]
 * @param {{id:string,label:string,icon:string}} [opts.category]  Highlight this attribute.
 * @param {boolean} [opts.compact]  Smaller variant for the result lineup.
 * @returns {HTMLElement}
 */
export function playerCard(player, opts = {}) {
  const { category, compact = false } = opts;
  const [primary, secondary] = player.colors;

  // Card art:
  //  - Photo: real headshot, NO monogram letters. A player has a photo when it
  //    carries an `nbaId` (NBA CDN) or a `photo` Commons file (soccer/EuroLeague).
  //  - Jersey art: CSS panel with the player's monogram letters. Used for the
  //    'jerseys' setting, and for any player without a photo source.
  const useJerseys = getSetting('cardArt') === 'jerseys' || !hasHeadshot(player);
  const number = el('span', { class: 'jersey__number', text: `#${player.number}` });
  const jerseyChildren = [number];

  if (useJerseys) {
    jerseyChildren.push(el('span', { class: 'jersey__monogram', text: player.monogram }));
  } else {
    const photo = el('img', {
      class: 'jersey__photo',
      attrs: {
        src: headshotUrl(player),
        alt: player.name,
        loading: 'eager',
        decoding: 'async',
        draggable: 'false',
      },
    });
    photo.addEventListener('load', () => photo.classList.add('is-loaded'), { once: true });
    // On failure just drop the image — panel + number stay, never letters.
    photo.addEventListener('error', () => photo.remove(), { once: true });
    jerseyChildren.push(photo);
  }

  const jersey = el('div', {
    class: useJerseys ? ['jersey', 'jersey--art'] : 'jersey',
    style: { '--c1': primary, '--c2': secondary },
    children: jerseyChildren,
  });

  const meta = el('div', {
    class: 'card__meta',
    children: [
      // Compact (result lineup) cards use the short surname so it stays on one
      // line in the narrow 3-up grid; the full name is kept as a tooltip.
      el('div', {
        class: 'card__name',
        text: compact ? player.short : player.name,
        attrs: compact ? { title: player.name } : undefined,
      }),
      el('div', { class: 'card__sub', text: `${player.team} · ${player.era}` }),
    ],
  });

  const children = [jersey, meta];

  if (category) {
    const value = player.attrs[category.id] ?? 0; // defensive: never render "undefined"
    children.push(
      el('div', {
        class: ['card__stat', ratingClass(value)],
        children: [
          el('span', { class: 'card__stat-label', text: `${category.icon} ${category.label}` }),
          el('span', { class: 'card__stat-value', text: String(value) }),
        ],
      })
    );
  }

  return el('div', {
    class: compact ? ['card', 'card--compact'] : 'card',
    children,
  });
}
