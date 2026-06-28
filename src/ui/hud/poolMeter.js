// A tiny HUD chip showing how many players are still in the shared draft pool.
// The draining count is the visible signal of contention/denial.

import { el } from '../dom.js';

/**
 * @param {number} remaining  players still pickable
 * @param {number} total      pool size at the start of the match
 * @returns {HTMLElement}
 */
export function poolMeter(remaining, total) {
  return el('div', {
    class: 'pool-meter',
    attrs: { title: 'Players left in the shared pool' },
    children: [
      el('span', { class: 'pool-meter__icon', text: '🃏' }),
      el('span', { class: 'pool-meter__count', text: `${remaining}` }),
      el('span', { class: 'pool-meter__total', text: `/ ${total} left` }),
    ],
  });
}
