// Live "roles covered" tracker (M-UX): which of the six signature roles your
// drafted players cover so far. Covering distinct roles drives the synergy
// multiplier; uncovered roles cap your overall — so this shows synergy progress
// as you build.

import { el } from '../dom.js';
import { categoriesForMode, playerForMode } from '../../data/modes.js';
import { primaryRole } from '../../engine/archetypes/archetypes.js';
import { HUMAN } from '../../engine/types.js';

/**
 * @param {import('../../engine/types.js').MatchState} state
 * @returns {HTMLElement}
 */
export function rolesTracker(state) {
  const mode = state.config.mode;
  const cats = categoriesForMode(mode);
  const board = state.boards[HUMAN] ?? {};
  const covered = new Set(
    Object.values(board).map((id) => primaryRole(playerForMode(mode, id), cats)),
  );

  const chips = cats.map((c) =>
    el('span', {
      class: ['role-chip', covered.has(c.id) ? 'role-chip--on' : 'role-chip--off'],
      attrs: { title: covered.has(c.id) ? `${c.label} — covered` : `${c.label} — not yet covered` },
      text: c.icon,
    }),
  );

  return el('div', {
    class: 'roles-tracker',
    attrs: { title: 'Distinct signature roles your team covers (drives synergy)' },
    children: [
      el('span', { class: 'roles-tracker__label', text: `Roles ${covered.size}/${cats.length}` }),
      el('div', { class: 'roles-tracker__chips', children: chips }),
    ],
  });
}
