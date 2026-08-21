import { describe, expect, it } from 'vitest';
import { specialistMasteryCalling } from './calling-depth-effects';

describe('Calling mastery expedition acceptance', () => {
  it('does not grant specialist mastery from a rejected expedition result', () => {
    const rejected = { accepted:false, grade:'A' as const, discovery:null, materialReward:0 };

    expect(specialistMasteryCalling('vanguard', { attack:1, dodge:0, charge:0 }, rejected)).toBeNull();
    expect(specialistMasteryCalling('arcanist', { attack:0, dodge:0, charge:1 }, rejected)).toBeNull();
    expect(specialistMasteryCalling('caretaker', { attack:0, dodge:1, charge:0 }, rejected)).toBeNull();
  });
});
