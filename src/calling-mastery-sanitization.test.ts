import { describe, expect, it } from 'vitest';
import { specialistMasteryCalling } from './calling-depth-effects';

describe('Calling mastery action sanitation', () => {
  it('does not treat non-finite or negative raw action counts as valid specialist actions', () => {
    const summary = { stageId:'forest_path' as const, grade:'A' as const, discovery:null, materialReward:1 };

    expect(specialistMasteryCalling('vanguard', {
      attack:Number.POSITIVE_INFINITY,
      dodge:0,
      charge:0,
    }, summary)).toBeNull();
    expect(specialistMasteryCalling('arcanist', {
      attack:0,
      dodge:0,
      charge:Number.NaN,
    }, summary)).toBeNull();
    expect(specialistMasteryCalling('caretaker', {
      attack:0,
      dodge:-1,
      charge:0,
    }, summary)).toBeNull();
    expect(specialistMasteryCalling('pathfinder', {
      attack:Number.POSITIVE_INFINITY,
      dodge:Number.NaN,
      charge:-1,
    }, { ...summary, discovery:'forest_echo' })).toBeNull();
  });

  it('does not treat malformed material rewards as Pathfinder exploration evidence', () => {
    const actions = { attack:1, dodge:0, charge:0 };
    const base = { stageId:'forest_path' as const, grade:'A' as const, discovery:null };

    expect(specialistMasteryCalling('pathfinder', actions, {
      ...base,
      materialReward:Number.POSITIVE_INFINITY,
    })).toBeNull();
    expect(specialistMasteryCalling('pathfinder', actions, {
      ...base,
      materialReward:Number.NaN,
    })).toBeNull();
    expect(specialistMasteryCalling('pathfinder', actions, {
      ...base,
      materialReward:-1,
    })).toBeNull();
  });

  it('requires a non-empty string discovery for Pathfinder exploration evidence', () => {
    const actions = { attack:1, dodge:0, charge:0 };
    const base = { stageId:'forest_path' as const, grade:'A' as const, materialReward:0 };

    for (const discovery of [undefined, 42, '', false] as any[]) {
      expect(specialistMasteryCalling('pathfinder', actions, {
        ...base,
        discovery,
      } as any)).toBeNull();
    }
    expect(specialistMasteryCalling('pathfinder', actions, {
      ...base,
      discovery:'forest_echo',
    })).toBe('pathfinder');
  });

  it('fails closed for malformed grades across all specialist callings', () => {
    const actions = { attack:1, dodge:1, charge:1 };
    for (const grade of ['Z', '', null, undefined, 42] as any[]) {
      const summary = {
        stageId:'forest_path' as const,
        grade,
        discovery:'forest_echo',
        materialReward:1,
      } as any;
      expect(specialistMasteryCalling('vanguard', actions, summary)).toBeNull();
      expect(specialistMasteryCalling('arcanist', actions, summary)).toBeNull();
      expect(specialistMasteryCalling('caretaker', actions, summary)).toBeNull();
      expect(specialistMasteryCalling('pathfinder', actions, summary)).toBeNull();
    }
  });
});