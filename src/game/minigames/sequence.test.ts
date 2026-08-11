import { describe, expect, it } from 'vitest';
import { generateSequence, sequenceAccuracy } from './sequence';

describe('magic rune sequence', () => {
  it('generates a sequence of the requested length using runes 0-3', () => {
    let n = 0;
    const seq = generateSequence(5, () => (n = (n + 0.31) % 1));
    expect(seq).toHaveLength(5);
    for (const rune of seq) expect(rune).toBeGreaterThanOrEqual(0), expect(rune).toBeLessThanOrEqual(3);
  });

  it('scores 1 for an exact match', () => {
    expect(sequenceAccuracy([0, 1, 2, 3], [0, 1, 2, 3])).toBe(1);
  });

  it('scores 0 for a completely wrong sequence of the same length', () => {
    expect(sequenceAccuracy([0, 0, 0, 0], [1, 1, 1, 1])).toBe(0);
  });

  it('scores partial credit for partially correct positions', () => {
    expect(sequenceAccuracy([0, 1, 2, 3], [0, 1, 0, 0])).toBe(0.5);
  });

  it('treats a shorter input as wrong for the missing positions', () => {
    expect(sequenceAccuracy([0, 1, 2, 3], [0, 1])).toBe(0.5);
  });

  it('ignores extra input beyond the target length', () => {
    expect(sequenceAccuracy([0, 1], [0, 1, 2, 3])).toBe(1);
  });
});
