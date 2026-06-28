// In-game pause overlay: a modal that dims and blurs the frozen round behind it
// and offers Resume, Settings, and Quit-to-menu (with a confirmation step).
// It owns its own DOM + key listener and returns a cleanup function. The reel
// is frozen by the caller (main.js) before this mounts, so nothing runs behind.

import { el, clear } from './dom.js';
import { sfx } from './sound.js';
import { renderSettings } from './settingsScreen.js';

/**
 * @param {HTMLElement} host  Element to append the overlay to (e.g. document.body).
 * @param {{ onResume: () => void, onQuit: () => void }} handlers
 *   onResume — dismiss the overlay and continue the current round.
 *   onQuit   — confirmed quit back to the title screen.
 * @returns {() => void} cleanup that removes the overlay and its listeners.
 */
export function mountPauseMenu(host, { onResume, onQuit }) {
  const panel = el('div', { class: 'pause__panel' });
  const overlay = el('div', { class: 'pause', children: [panel] });
  let view = 'menu'; // 'menu' | 'settings' | 'confirm'

  const button = (cls, label, onClick) => {
    const b = el('button', { class: cls, text: label, attrs: { type: 'button' } });
    b.addEventListener('click', onClick);
    return b;
  };

  function showMenu() {
    view = 'menu';
    clear(panel);
    panel.classList.remove('pause__panel--wide');
    panel.append(
      el('div', {
        class: 'pause__card',
        children: [
          el('div', {
            class: 'pause__title',
            children: [el('span', { class: 'pause__icon', text: '⏸' }), el('span', { text: 'Paused' })],
          }),
          button('btn btn--primary btn--block', '▶  Resume', () => {
            sfx.click();
            onResume();
          }),
          button('btn btn--ghost btn--block', '⚙  Settings', () => {
            sfx.click();
            showSettings();
          }),
          button('btn btn--ghost btn--block pause__quit', '🚪  Quit to Menu', () => {
            sfx.click();
            showConfirm();
          }),
        ],
      })
    );
  }

  function showSettings() {
    view = 'settings';
    clear(panel);
    panel.classList.add('pause__panel--wide');
    renderSettings(panel, { onBack: showMenu });
  }

  function showConfirm() {
    view = 'confirm';
    clear(panel);
    panel.classList.remove('pause__panel--wide');
    panel.append(
      el('div', {
        class: 'pause__card',
        children: [
          el('div', { class: 'pause__heading', text: 'Quit to menu?' }),
          el('p', {
            class: 'pause__msg',
            text: 'Your current build will be lost. Are you sure you want to quit?',
          }),
          el('div', {
            class: 'pause__confirm',
            children: [
              button('btn btn--ghost', 'Cancel', () => {
                sfx.click();
                showMenu();
              }),
              button('btn btn--danger', 'Quit', () => {
                sfx.click();
                onQuit();
              }),
            ],
          }),
        ],
      })
    );
  }

  // Escape resumes from the menu, or steps back to the menu from a sub-view.
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    if (view === 'menu') onResume();
    else showMenu();
  };
  window.addEventListener('keydown', onKey);

  host.append(overlay);
  showMenu();

  return () => {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  };
}
