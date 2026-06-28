// The settings screen. Renders every available setting as a labelled control
// (toggle / slider / segmented) bound to the settings store. Changes are saved
// and broadcast immediately by core/settings.js, so effects (audio, motion)
// apply live via the subscription wired in main.js.

import { el, clear } from './dom.js';
import { getSettings, updateSetting, resetSettings } from '../core/settings.js';
import { sfx } from './sound.js';

/**
 * @param {HTMLElement} root
 * @param {{ onBack: () => void }} handlers
 */
export function renderSettings(root, { onBack }) {
  clear(root);

  const back = el('button', { class: 'iconbtn settings__back', text: '←', attrs: { type: 'button', 'aria-label': 'Back' } });
  back.addEventListener('click', () => {
    sfx.click();
    onBack();
  });

  const reset = el('button', { class: 'btn btn--ghost', text: '↺  Reset to defaults' });
  reset.addEventListener('click', () => {
    sfx.click();
    resetSettings();
    renderSettings(root, { onBack }); // rebuild so every control reflects defaults
  });

  const done = el('button', { class: 'btn btn--primary', text: '✓  Done' });
  done.addEventListener('click', () => {
    sfx.click();
    onBack();
  });

  root.append(
    el('section', {
      class: 'screen settings',
      children: [
        el('div', {
          class: 'settings__head',
          children: [back, el('h1', { class: 'settings__title', text: 'Settings' })],
        }),

        section('🔊 Audio', [
          toggleRow({ label: 'Music', desc: 'Looping arena beat', key: 'music' }),
          sliderRow({ label: 'Music volume', key: 'musicVolume' }),
          toggleRow({ label: 'Sound effects', desc: 'Dribble, swish, buzzer, crowd', key: 'sfx' }),
          sliderRow({ label: 'Effects volume', key: 'sfxVolume' }),
        ]),

        section('🏀 Gameplay', [
          segmentedRow({
            label: 'Reel speed',
            desc: 'How fast the faces fly by',
            key: 'reelSpeed',
            options: [
              { value: 'chill', label: 'Chill' },
              { value: 'normal', label: 'Normal' },
              { value: 'hyper', label: 'Hyper' },
            ],
          }),
          toggleRow({ label: 'Spin motion FX', desc: '3D drum roll + motion blur', key: 'spinFx' }),
        ]),

        section('🎨 Display', [
          segmentedRow({
            label: 'Card art',
            desc: 'Real headshots, or CSS jersey letters',
            key: 'cardArt',
            options: [
              { value: 'photos', label: 'Photos' },
              { value: 'jerseys', label: 'Jerseys' },
            ],
          }),
        ]),

        el('div', { class: 'settings__actions', children: [reset, done] }),
      ],
    })
  );
}

// --- control builders ------------------------------------------------------

function section(title, rows) {
  return el('div', {
    class: 'settings__section',
    children: [
      el('div', { class: 'settings__section-title', text: title }),
      el('div', { class: 'settings__card', children: rows }),
    ],
  });
}

function row(label, desc, control, { stack = false } = {}) {
  return el('div', {
    class: stack ? ['srow', 'srow--stack'] : 'srow',
    children: [
      el('div', {
        class: 'srow__text',
        children: [
          el('div', { class: 'srow__label', text: label }),
          desc ? el('div', { class: 'srow__desc', text: desc }) : null,
        ],
      }),
      control,
    ],
  });
}

function toggleRow({ label, desc, key }) {
  const input = el('input', { class: 'switch__input', attrs: { type: 'checkbox', role: 'switch' } });
  input.checked = Boolean(getSettings()[key]);
  input.addEventListener('change', () => {
    sfx.click();
    updateSetting(key, input.checked);
  });
  const sw = el('label', {
    class: 'switch',
    children: [input, el('span', { class: 'switch__track', children: [el('span', { class: 'switch__thumb' })] })],
  });
  return row(label, desc, sw);
}

function sliderRow({ label, desc, key }) {
  const value = Number(getSettings()[key]);
  const badge = el('span', { class: 'srow__value', text: `${value}%` });
  const input = el('input', {
    class: 'slider',
    attrs: { type: 'range', min: '0', max: '100', step: '5', value: String(value), 'aria-label': label },
  });
  input.addEventListener('input', () => {
    badge.textContent = `${input.value}%`;
    updateSetting(key, Number(input.value));
  });
  const control = el('div', { class: 'srow__slider', children: [input, badge] });
  return row(label, desc, control, { stack: true });
}

function segmentedRow({ label, desc, key, options }) {
  const group = el('div', { class: 'segmented' });
  for (const opt of options) {
    const btn = el('button', {
      class: opt.value === getSettings()[key] ? ['segmented__btn', 'is-active'] : 'segmented__btn',
      text: opt.label,
      attrs: { type: 'button' },
    });
    btn.addEventListener('click', () => {
      if (getSettings()[key] === opt.value) return;
      sfx.click();
      updateSetting(key, opt.value);
      for (const b of group.children) b.classList.remove('is-active');
      btn.classList.add('is-active');
    });
    group.append(btn);
  }
  return row(label, desc, group);
}
