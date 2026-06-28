// Opponent (CPU) status shown during a vs-AI match: their drafted picks so far
// and their projected overall, so the human can read the race and counter-pick.

import { el } from './../dom.js';
import { categoriesForMode, playerForMode } from '../../data/modes.js';
import { projectBuild } from '../../engine/scoring/scoring.js';

/**
 * @param {import('../../engine/types.js').MatchState} state
 * @param {string} actor  opponent actor id (e.g. 'cpu')
 * @param {string} label  display label (e.g. '🤖 CPU')
 * @returns {HTMLElement}
 */
export function opponentTray(state, actor, label) {
  const mode = state.config.mode;
  const board = state.boards[actor] ?? {};
  const proj = projectBuild(board, mode);

  const slots = categoriesForMode(mode).map((c) => {
    const picked = board[c.id];
    return el('span', {
      class: ['opp-slot', picked ? 'opp-slot--filled' : 'opp-slot--empty'],
      attrs: { title: picked ? `${c.label}: ${playerForMode(mode, picked).short}` : c.label },
      text: c.icon,
    });
  });

  return el('div', {
    class: 'opponent',
    children: [
      el('div', {
        class: 'opponent__head',
        children: [
          el('span', { class: 'opponent__name', text: label }),
          el('span', {
            class: 'opponent__ovr',
            // Projected from filled slots only — show the count so a 2/6 lead
            // isn't mistaken for a final score.
            text: proj.filled ? `${proj.overall} OVR · ${proj.filled}/${proj.total}` : '—',
          }),
        ],
      }),
      el('div', { class: 'opponent__slots', children: slots }),
    ],
  });
}
