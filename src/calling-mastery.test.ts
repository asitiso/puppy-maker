import { describe, expect, it } from 'vitest';
import { callingMasteryLevel, emptyCallingMastery } from './calling-mastery';

describe('calling mastery', () => {
  it('starts all four callings at zero xp', () => {
    expect(emptyCallingMastery()).toEqual({ vanguard:0, arcanist:0, caretaker:0, pathfinder:0 });
  });

  it('uses the approved five mastery thresholds', () => {
    expect([0,2,3,6,7,11,12,17,18,99].map(callingMasteryLevel)).toEqual([1,1,2,2,3,3,4,4,5,5]);
  });
});
