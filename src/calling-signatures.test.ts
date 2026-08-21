import { describe, expect, it } from 'vitest';
import { callingSignatureDefinitions, callingSignatures } from './calling-signatures';

describe('calling signature abilities', () => {
  it('defines two signatures for each calling with increasing mastery requirements', () => {
    expect(callingSignatureDefinitions).toHaveLength(8);
    for (const calling of ['vanguard','arcanist','caretaker','pathfinder'] as const) {
      const signatures = callingSignatureDefinitions.filter(item => item.calling === calling);
      expect(signatures).toHaveLength(2);
      expect(signatures.map(item => item.requiredMasteryLevel)).toEqual([2,4]);
    }
  });

  it('keeps legacy trait-only lookup compatible when mastery is omitted', () => {
    expect(callingSignatures('vanguard', ['vanguard_power'])).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus'])).toEqual(['rally_strike']);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'])).toEqual(['rally_strike','guardian_breaker']);
    expect(callingSignatures('arcanist', ['vanguard_power','vanguard_focus'])).toEqual([]);
    expect(callingSignatures(null, ['vanguard_power','vanguard_focus'])).toEqual([]);
  });

  it('requires both the trait and Calling mastery when mastery XP is supplied', () => {
    const traits = ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as const;
    expect(callingSignatures('vanguard', [...traits], 2)).toEqual([]);
    expect(callingSignatures('vanguard', [...traits], 3)).toEqual(['rally_strike']);
    expect(callingSignatures('vanguard', [...traits], 11)).toEqual(['rally_strike']);
    expect(callingSignatures('vanguard', [...traits], 12)).toEqual(['rally_strike','guardian_breaker']);
  });

  it('does not let mastery bypass missing prerequisite traits', () => {
    expect(callingSignatures('vanguard', ['vanguard_power'], 999)).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus'], 999)).toEqual(['rally_strike']);
  });

  it('treats malformed mastery XP as level one when mastery is supplied', () => {
    const traits = ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as const;
    expect(callingSignatures('vanguard', [...traits], Number.NaN)).toEqual([]);
    expect(callingSignatures('vanguard', [...traits], Number.POSITIVE_INFINITY)).toEqual([]);
    expect(callingSignatures('vanguard', [...traits], -3)).toEqual([]);
  });
});
