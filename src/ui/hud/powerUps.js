// Power-up controls (M3): Reroll re-spins the remaining pool; Freeze slows the
// reel for one precise lock. Both are scarce and use-it-or-lose-it per match.

import { el } from '../dom.js';
import { sfx } from '../sound.js';

/**
 * @param {{ economy:{rerolls:number,freezes:number}, frozen:boolean,
 *           onReroll:()=>void, onFreeze:()=>void }} cfg
 * @returns {HTMLElement}
 */
export function powerUps({ economy, frozen, onReroll, onFreeze }) {
  const reroll = powerBtn('🔄', 'Reroll', economy.rerolls, economy.rerolls <= 0, () => {
    sfx.click();
    onReroll();
  });

  const freeze = powerBtn('❄️', frozen ? 'Frozen' : 'Freeze', economy.freezes, frozen || economy.freezes <= 0, () => {
    sfx.click();
    onFreeze();
  });
  if (frozen) freeze.classList.add('powerup--active');

  return el('div', { class: 'powerups', children: [reroll, freeze] });
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
