import { describe, expect, it } from 'vitest';
import { callingSignatureDefinitions, callingSignatures } from './calling-signatures';

describe('calling signature abilities', () => {
  it('defines two signatures for each calling', () => {
    expect(callingSignatureDefinitions).toHaveLength(8);
    for (const calling of ['vanguard','arcanist','caretaker','pathfinder'] as const) {
      expect(callingSignatureDefinitions.filter(item => item.calling === calling)).toHaveLength(2);
    }
  });

  it('unlocks signatures from tier-two and tier-four traits only for the active calling', () => {
    expect(callingSignatures('vanguard', ['vanguard_power'])).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus'])).toEqual(['rally_strike']);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'])).toEqual(['rally_strike','guardian_breaker']);
    expect(callingSignatures('arcanist', ['vanguard_power','vanguard_focus'])).toEqual([]);
    expect(callingSignatures(null, ['vanguard_power','vanguard_focus'])).toEqual([]);
  });
});
