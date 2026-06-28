import { describe, it, expect } from 'vitest';
import { makeRng, shuffle, pickOne, nextInt } from './rng.js';

describe('makeRng', () => {
  it('is deterministic: same seed -> same stream', () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('different seeds -> different streams', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it('produces floats in [0, 1)', () => {
    const r = makeRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('state() lets a stream be resumed exactly', () => {
    const a = makeRng(777);
    a.next();
    a.next();
    const saved = a.state();
    const continued = [a.next(), a.next(), a.next()];

    const resumed = makeRng(saved >>> 0); // resume from the saved counter
    // makeRng seeds from a raw integer; feeding the saved counter reproduces the
    // tail of the original stream.
    const replay = [resumed.next(), resumed.next(), resumed.next()];
    expect(replay).toEqual(continued);
  });
});

describe('shuffle', () => {
  it('preserves length and membership and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const rng = makeRng(42).next;
    const out = shuffle(rng, input);
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('is deterministic for a given seed', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(makeRng(7).next, input)).toEqual(shuffle(makeRng(7).next, input));
  });
});

describe('pickOne / nextInt', () => {
  it('pickOne returns a member and throws on empty', () => {
    const rng = makeRng(3).next;
    expect([10, 20, 30]).toContain(pickOne(rng, [10, 20, 30]));
    expect(() => pickOne(rng, [])).toThrow();
  });

  it('nextInt stays in range', () => {
    const rng = makeRng(5).next;
    for (let i = 0; i < 500; i++) {
      const v = nextInt(rng, 6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
    }
  });
});
