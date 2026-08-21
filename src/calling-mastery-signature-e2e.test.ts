import { describe, expect, it } from 'vitest';
import { emptyCallingMastery } from './calling-mastery';
import { callingSignaturesForMastery } from './calling-signatures';
import { incrementCallingMonthMastery } from './raising-depth-rewards';

describe('Calling -> Mastery -> Signature', () => {
  it('does not unlock a tier-two signature before Calling mastery level 2', () => {
    const traits = ['vanguard_power', 'vanguard_focus'] as const;
    expect(callingSignaturesForMastery('vanguard', 0, [...traits])).toEqual([]);
    expect(callingSignaturesForMastery('vanguard', 2, [...traits])).toEqual([]);
    expect(callingSignaturesForMastery('vanguard', 3, [...traits])).toEqual(['rally_strike']);
  });

  it('reaches the first signature through real monthly mastery progression', () => {
    let mastery = emptyCallingMastery();
    mastery = incrementCallingMonthMastery(mastery, 'vanguard');
    mastery = incrementCallingMonthMastery(mastery, 'vanguard');
    expect(callingSignaturesForMastery('vanguard', mastery.vanguard, ['vanguard_power','vanguard_focus'])).toEqual([]);
    mastery = incrementCallingMonthMastery(mastery, 'vanguard');
    expect(callingSignaturesForMastery('vanguard', mastery.vanguard, ['vanguard_power','vanguard_focus'])).toEqual(['rally_strike']);
  });

  it('requires mastery level 4 for the tier-four signature', () => {
    const traits = ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as const;
    expect(callingSignaturesForMastery('vanguard', 11, [...traits])).toEqual(['rally_strike']);
    expect(callingSignaturesForMastery('vanguard', 12, [...traits])).toEqual(['rally_strike','guardian_breaker']);
  });
});
