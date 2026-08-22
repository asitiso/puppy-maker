import { describe, expect, it } from 'vitest';
import { specialistMasteryCalling } from './calling-depth-effects';
import { finishExpeditionBattle, startExpeditionBattle } from './expedition-combat';

describe('expedition result action sanitization', () => {
  it('does not leak malformed action counts into Calling mastery decisions', () => {
    const result = finishExpeditionBattle({
      ...startExpeditionBattle('forest_path'),
      score: 700,
      actionCount: Number.POSITIVE_INFINITY,
      actionKinds: {
        attack: Number.POSITIVE_INFINITY,
        dodge: Number.NaN,
        charge: -4,
      },
    });

    expect(result.grade).toBe('A');
    expect(result.actionKinds).toEqual({ attack:0, dodge:0, charge:0 });
    expect(specialistMasteryCalling('vanguard', result.actionKinds, {
      stageId:result.stageId,
      grade:result.grade,
      discovery:null,
      materialReward:1,
    })).toBeNull();
  });
});