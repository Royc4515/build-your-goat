// Live projection of the build so far (M4): the running average of locked slots
// and its tier, so players feel the ladder move with every pick.

import { el } from '../dom.js';
import { projectBuild } from '../../engine/scoring/scoring.js';

/**
 * @param {import('../../engine/types.js').MatchState} state
 * @returns {HTMLElement}
 */
export function buildProjection(state) {
  const p = projectBuild(state.picks, state.config.mode);
  const started = p.filled > 0;
  return el('div', {
    class: 'projection',
    attrs: { title: 'Projected overall from your picks so far' },
    children: [
      el('span', { class: 'projection__label', text: 'Projected' }),
      el('span', { class: 'projection__ovr', text: started ? String(p.overall) : '—' }),
      el('span', {
        class: 'projection__tier',
        text: started ? `${p.tier.emoji} ${p.tier.label}` : 'lock a pick to start',
      }),
      el('span', { class: 'projection__count', text: `${p.filled}/${p.total}` }),
    ],
  });
}
