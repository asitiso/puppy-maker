import { describe, expect, it } from 'vitest';
import { callingSignatureDefinitions, callingSignatures } from './calling-signatures';
import { growthTraitDefinitions } from './growth-traits';

describe('calling signature abilities', () => {
  it('defines two signatures for each calling with increasing mastery requirements', () => {
    expect(callingSignatureDefinitions).toHaveLength(8);
    expect(new Set(callingSignatureDefinitions.map(item => item.id)).size).toBe(callingSignatureDefinitions.length);
    for (const calling of ['vanguard','arcanist','caretaker','pathfinder'] as const) {
      const signatures = callingSignatureDefinitions.filter(item => item.calling === calling);
      expect(signatures).toHaveLength(2);
      expect(signatures.map(item => item.requiredMasteryLevel)).toEqual([2,4]);
      expect(signatures.map(item => growthTraitDefinitions.find(trait => trait.id === item.requiredTrait)?.calling)).toEqual([calling, calling]);
      expect(signatures.map(item => growthTraitDefinitions.find(trait => trait.id === item.requiredTrait)?.tier)).toEqual([2,4]);
    }
  });

  it('fails closed when Calling mastery XP is omitted instead of bypassing the mastery gate', () => {
    expect(callingSignatures('vanguard', ['vanguard_power'])).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus'])).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'])).toEqual([]);
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

  it('does not unlock signatures from orphaned upper-tier traits', () => {
    expect(callingSignatures('vanguard', ['vanguard_focus'], 3)).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_legend'], 12)).toEqual([]);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus','vanguard_legend'], 12)).toEqual(['rally_strike']);
    expect(callingSignatures('vanguard', ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'], 12))
      .toEqual(['rally_strike','guardian_breaker']);
  });

  it('treats malformed mastery XP as level one when mastery is supplied', () => {
    const traits = ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as const;
    expect(callingSignatures('vanguard', [...traits], Number.NaN)).toEqual([]);
    expect(callingSignatures('vanguard', [...traits], Number.POSITIVE_INFINITY)).toEqual([]);
    expect(callingSignatures('vanguard', [...traits], -3)).toEqual([]);
  });
});
