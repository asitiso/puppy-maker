import { describe, expect, it } from 'vitest';
import { applyCallingSelection, callingSwitchKey } from './guardian-callings';

describe('guardian calling corruption boundaries', () => {
  it('canonicalizes non-finite year and month into a stable switch key', () => {
    expect(callingSwitchKey(Number.NaN, Number.POSITIVE_INFINITY)).toBe('1-1');
    expect(callingSwitchKey(Number.NEGATIVE_INFINITY, -99)).toBe('1-1');
  });

  it('blocks a paid switch when gold is non-finite instead of creating NaN currency', () => {
    const result = applyCallingSelection({
      current:'vanguard',
      next:'arcanist',
      guardianRank:'guardian',
      gold:Number.NaN,
      year:2,
      month:7,
      lastSwitchKey:null,
      history:['vanguard'],
    });
    expect(result).toMatchObject({ changed:false, reason:'insufficient_gold', current:'vanguard', gold:0 });
  });

  it('canonicalizes duplicate history when a new Calling is selected', () => {
    const result = applyCallingSelection({
      current:'vanguard',
      next:'caretaker',
      guardianRank:'guardian',
      gold:500,
      year:2,
      month:8,
      lastSwitchKey:null,
      history:['vanguard','vanguard','arcanist'],
    });
    expect(result.history).toEqual(['vanguard','arcanist','caretaker']);
  });
});
