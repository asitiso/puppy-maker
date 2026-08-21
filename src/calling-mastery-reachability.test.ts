import { describe, expect, it } from 'vitest';
import { callingMasteryLevel, emptyCallingMastery } from './calling-mastery';
import { incrementCallingMonthMastery } from './raising-depth-rewards';
import type { GuardianCallingId } from './guardian-callings';

function advanceMonths(calling: GuardianCallingId, months: number) {
  let mastery = emptyCallingMastery();
  for (let month = 0; month < months; month += 1) mastery = incrementCallingMonthMastery(mastery, calling);
  return mastery;
}

describe('Calling mastery reachability', () => {
  it('lets every Calling reach level five from monthly progression alone', () => {
    for (const calling of ['vanguard','arcanist','caretaker','pathfinder'] as const) {
      const atLevelFour = advanceMonths(calling, 12);
      const atLevelFive = advanceMonths(calling, 18);

      expect(atLevelFour[calling]).toBe(12);
      expect(callingMasteryLevel(atLevelFour[calling])).toBe(4);
      expect(atLevelFive[calling]).toBe(18);
      expect(callingMasteryLevel(atLevelFive[calling])).toBe(5);
    }
  });

  it('preserves previous Calling mastery while only the active Calling gains the monthly point', () => {
    let mastery = advanceMonths('vanguard', 7);
    mastery = incrementCallingMonthMastery(mastery, 'arcanist');
    mastery = incrementCallingMonthMastery(mastery, 'arcanist');

    expect(mastery).toEqual({ vanguard:7, arcanist:2, caretaker:0, pathfinder:0 });
    expect(callingMasteryLevel(mastery.vanguard)).toBe(3);
    expect(callingMasteryLevel(mastery.arcanist)).toBe(1);
  });
});
