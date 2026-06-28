// Social share sheet: a small modal of share targets (X, WhatsApp, Telegram,
// Facebook, Reddit) plus Copy and, where supported, the device's native share
// sheet. Self-contained — mounts to <body> and cleans itself up on close
// (Escape, backdrop click, or after picking a target).

import { el } from './dom.js';
import { sfx } from './sound.js';

/** Networks shown in the grid, in display order, with brand glyphs. */
const NETWORKS = [
  { id: 'x', label: 'X', icon: '𝕏' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'reddit', label: 'Reddit', icon: '👽' },
];

/** Build the web share-intent URL for a network from the share payload. */
function intentUrl(net, { title, text, url }) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  const ti = encodeURIComponent(title);
  switch (net) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case 'whatsapp':
      // WhatsApp only carries text, so fold the link into it.
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${t}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
    case 'reddit':
      return `https://www.reddit.com/submit?url=${u}&title=${ti}`;
    default:
      return url;
  }
}

/**
 * Open the share sheet for a payload.
 * @param {{ title: string, text: string, url: string }} payload
 */
export function openShareSheet(payload) {
  sfx.click();

  const panel = el('div', {
    class: 'share__panel',
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Share' },
  });
  const overlay = el('div', { class: 'share', children: [panel] });

  const close = () => {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('keydown', onKey);

  const grid = el('div', {
    class: 'share__grid',
    children: NETWORKS.map((n) => {
      const b = el('button', {
        class: ['share__net', `share__net--${n.id}`],
        attrs: { type: 'button' },
        children: [
          el('span', { class: 'share__net-icon', text: n.icon }),
          el('span', { class: 'share__net-label', text: n.label }),
        ],
      });
      b.addEventListener('click', () => {
        sfx.click();
        window.open(intentUrl(n.id, payload), '_blank', 'noopener,noreferrer');
        close();
      });
      return b;
    }),
  });

  const COPY_LABEL = '🔗  Copy text & link';
  const copyBtn = el('button', { class: 'btn btn--ghost btn--block', text: COPY_LABEL, attrs: { type: 'button' } });
  copyBtn.addEventListener('click', () => {
    sfx.click();
    const blob = `${payload.text}\n${payload.url}`;
    const flash = (msg) => {
      copyBtn.textContent = msg;
      window.setTimeout(() => (copyBtn.textContent = COPY_LABEL), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(blob).then(() => flash('✅  Copied!')).catch(() => flash('⚠️  Copy failed'));
    } else {
      flash('⚠️  Not supported');
    }
  });

  const actions = [copyBtn];
  // The native share sheet reaches apps the grid can't (Messages, email, etc.).
  if (navigator.share) {
    const nativeBtn = el('button', { class: 'btn btn--ghost btn--block', text: '📱  More apps…', attrs: { type: 'button' } });
    nativeBtn.addEventListener('click', () => {
      sfx.click();
      navigator.share(payload).then(close).catch(() => {/* user dismissed the sheet */});
    });
    actions.push(nativeBtn);
  }

  const closeX = el('button', {
    class: 'share__close',
    text: '✕',
    attrs: { type: 'button', 'aria-label': 'Close' },
  });
  closeX.addEventListener('click', () => {
    sfx.click();
    close();
  });

  panel.append(
    el('div', {
      class: 'share__card',
      children: [
        closeX,
        el('div', {
          class: 'share__title',
          children: [el('span', { text: '📤' }), el('span', { text: 'Share' })],
        }),
        el('p', { class: 'share__preview', text: payload.text }),
        grid,
        ...actions,
      ],
    })
  );

  document.body.append(overlay);
}
