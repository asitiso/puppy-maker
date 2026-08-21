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

  it('does not let a stale switch key block the first free Calling selection', () => {
    const result = applyCallingSelection({
      current:null,
      next:'arcanist',
      guardianRank:'guardian',
      gold:0,
      year:2,
      month:7,
      lastSwitchKey:'2-7',
      history:[],
    });
    expect(result).toMatchObject({ changed:true, reason:null, current:'arcanist', gold:0 });
  });

  it('treats zero-padded switch keys as the same month for the monthly lock', () => {
    const result = applyCallingSelection({
      current:'vanguard',
      next:'arcanist',
      guardianRank:'guardian',
      gold:500,
      year:2,
      month:7,
      lastSwitchKey:'2-07',
      history:['vanguard'],
    });
    expect(result).toMatchObject({ changed:false, reason:'monthly_lock', current:'vanguard', gold:500 });
  });

  it('canonicalizes duplicate history without destroying first-seen chronology', () => {
    const result = applyCallingSelection({
      current:'vanguard',
      next:'caretaker',
      guardianRank:'guardian',
      gold:500,
      year:2,
      month:8,
      lastSwitchKey:null,
      history:['pathfinder','vanguard','pathfinder','arcanist'],
    });
    expect(result.history).toEqual(['pathfinder','vanguard','arcanist','caretaker']);
  });
});
