// Power-up controls. Two scarce, use-it-or-lose-it tools, each active on its own
// screen so the timing is clear:
//   ❄️ Freeze — during the spin, slows the reel for one precise lock.
//   🔄 Redo   — on the reveal, undoes the pick and re-spins that slot.
// Both counts are always shown (for planning); only the relevant one is enabled.

import { el } from '../dom.js';
import { sfx } from '../sound.js';

/**
 * @param {{ economy:{rerolls:number,freezes:number}, frozen:boolean,
 *           allowReroll?:boolean, allowFreeze?:boolean,
 *           onReroll?:()=>void, onFreeze?:()=>void }} cfg
 * @returns {HTMLElement}
 */
export function powerUps({ economy, frozen, allowReroll = false, allowFreeze = false, onReroll, onFreeze }) {
  const redo = powerBtn('🔄', 'Redo', economy.rerolls, !allowReroll || economy.rerolls <= 0, () => {
    sfx.click();
    onReroll && onReroll();
  });

  const freezeDisabled = !allowFreeze || frozen || economy.freezes <= 0;
  const freeze = powerBtn('❄️', frozen ? 'Frozen' : 'Freeze', economy.freezes, freezeDisabled, () => {
    sfx.click();
    onFreeze && onFreeze();
  });
  if (frozen) freeze.classList.add('powerup--active');

  return el('div', { class: 'powerups', children: [freeze, redo] });
}

function powerBtn(icon, label, count, disabled, onClick) {
  const btn = el('button', {
    class: 'powerup',
    attrs: { type: 'button', 'aria-label': `${label} (${count} left)` },
    children: [
      el('span', { class: 'powerup__icon', text: icon }),
      el('span', { class: 'powerup__label', text: label }),
      el('span', { class: 'powerup__count', text: `${count}` }),
    ],
  });
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}
