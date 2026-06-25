// Tiny DOM helpers so the rest of the UI reads declaratively and stays
// XSS-safe (we set textContent, never innerHTML with dynamic values).

/**
 * Create an element.
 * @param {string} tag
 * @param {Object} [opts]
 * @param {string|string[]} [opts.class]   className(s).
 * @param {string} [opts.text]             textContent.
 * @param {Object} [opts.attrs]            attributes to set.
 * @param {Object} [opts.style]            inline styles (camelCase or kebab).
 * @param {Node[]} [opts.children]
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.class) node.className = Array.isArray(opts.class) ? opts.class.join(' ') : opts.class;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  if (opts.style) {
    // CSS custom properties (--foo) must go through setProperty; plain bracket
    // assignment silently no-ops for them.
    for (const [k, v] of Object.entries(opts.style)) {
      if (k.startsWith('--')) node.style.setProperty(k, v);
      else node.style[k] = v;
    }
  }
  if (opts.children) for (const c of opts.children) if (c) node.append(c);
  return node;
}

/** Remove all children of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Get an element by id or throw a clear error (fail fast on bad wiring). */
export function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Expected #${id} in the DOM`);
  return node;
}
