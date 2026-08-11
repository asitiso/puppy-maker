import { describe, expect, it } from 'vitest';
import { breathPhase, breathAccuracy } from './rhythm';

describe('rest training breathing rhythm', () => {
  it('starts a cycle at phase 0 (fully exhaled)', () => {
    expect(breathPhase(0, 4000)).toBe(0);
  });

  it('reaches phase 1 (fully inhaled, the peak) at half the period', () => {
    expect(breathPhase(2000, 4000)).toBe(1);
  });

  it('returns to phase 0 at a full period (wraps around)', () => {
    expect(breathPhase(4000, 4000)).toBeCloseTo(0, 5);
  });

  it('wraps elapsed time longer than one period', () => {
    expect(breathPhase(6000, 4000)).toBeCloseTo(breathPhase(2000, 4000), 5);
  });

  it('scores full accuracy for a tap exactly at the peak', () => {
    expect(breathAccuracy(2000, 4000)).toBe(1);
  });

  it('scores zero accuracy for a tap exactly at the trough', () => {
    expect(breathAccuracy(0, 4000)).toBe(0);
  });

  it('scores partial accuracy for a tap between trough and peak', () => {
    expect(breathAccuracy(1000, 4000)).toBeCloseTo(0.5, 5);
  });
});
