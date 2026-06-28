// Small randomness helpers. Kept pure-ish (they read Math.random) and isolated
// so the rest of the game logic stays deterministic and easy to reason about.

/** Return a new array shuffled with Fisher-Yates (does not mutate input). */
export function shuffle(items) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick one random element from a non-empty array. */
export function pickOne(items) {
  if (!items.length) {
    throw new Error('pickOne: cannot pick from an empty array');
  }
  return items[Math.floor(Math.random() * items.length)];
}
