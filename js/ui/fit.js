// Guarantees a content screen (intro / result / settings) fits the visible app
// area with no scroll, on any device. If its natural content is taller than the
// available height, it's scaled down just enough to fit (never up). Re-runs on
// resize / orientation change and when the mobile address bar shows or hides.
// The play screen is excluded — it fills the height via flexbox already.

let current = null;

function apply() {
  const el = current;
  if (!el || !el.isConnected || !el.parentElement) return;

  // Neutralize the flex constraint and any prior scale so we measure the TRUE
  // content height. (A flex:1 column would otherwise compress its children to
  // its own box and hide the overflow, defeating the measurement.)
  el.style.transform = 'none';
  el.style.flex = 'none';
  el.style.height = 'auto';

  // Available = the parent's content box (clientHeight includes padding, so
  // subtract it).
  const frame = el.parentElement;
  const cs = getComputedStyle(frame);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const available = frame.clientHeight - padY;
  const natural = el.offsetHeight;

  // We anchor at the top and do our own vertical positioning so scaling and
  // centring never fight (flex `justify-content: center` would centre the
  // unscaled — too-tall — box and clip its top before the scale even applies).
  el.style.transformOrigin = 'top center';
  if (natural > available) {
    el.style.transform = `scale(${(available - 1) / natural})`; // shrink to fit
  } else {
    el.style.transform = `translateY(${Math.round((available - natural) / 2)}px)`; // centre
  }
}

/** Track and immediately fit a screen element. Pass null to stop tracking. */
export function fitScreen(el) {
  current = el || null;
  apply();
}

let raf = 0;
const reflow = () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(apply);
};
window.addEventListener('resize', reflow);
window.addEventListener('orientationchange', reflow);
