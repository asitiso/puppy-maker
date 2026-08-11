import { describe, expect, it } from 'vitest';
import { pickTarget, spotAccuracy } from './spotmatch';

describe('herb gathering spot match', () => {
  it('picks a target index within range using the given random source', () => {
    expect(pickTarget(6, () => 0)).toBe(0);
    expect(pickTarget(6, () => 0.999)).toBe(5);
  });

  it('scores 0 for picking the wrong spot regardless of speed', () => {
    expect(spotAccuracy(2, 0, 100, 2000)).toBe(0);
    expect(spotAccuracy(2, 0, 1900, 2000)).toBe(0);
  });

  it('scores full accuracy for an instant correct pick', () => {
    expect(spotAccuracy(2, 2, 0, 2000)).toBe(1);
  });

  it('scores zero accuracy for a correct pick that used the entire time limit', () => {
    expect(spotAccuracy(2, 2, 2000, 2000)).toBe(0);
  });

  it('scores partial accuracy proportional to remaining time for a correct pick', () => {
    expect(spotAccuracy(2, 2, 500, 2000)).toBeCloseTo(0.75, 5);
  });

  it('never returns a negative score for a reaction slower than the limit', () => {
    expect(spotAccuracy(2, 2, 5000, 2000)).toBe(0);
  });
});
