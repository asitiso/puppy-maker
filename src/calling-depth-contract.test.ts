import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards } from './calling-depth-effects';

const vanguardTraits = ['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as const;

describe('Calling depth player-facing contracts', () => {
  it('applies Vanguard Legend to the first successful expedition clear of a month even on a replayed stage', () => {
    const result = applyExpeditionCallingRewards({
      year:2,
      month:6,
      calling:'vanguard',
      traits:[...vanguardTraits],
      signatures:[],
      legendRewardKeys:[],
      stageId:'forest_path',
      grade:'A',
      firstClear:false,
      discovery:null,
      regionCompleted:null,
      materialReward:1,
      fatigueDelta:8,
      stressDelta:6,
    });

    expect(result.fatigueDelta).toBe(6);
    expect(result.legendRewardKeys).toEqual(['2-6:vanguard_legend']);
    expect(result.applied).toContain('vanguard_legend');
  });

  it('does not spend the monthly Vanguard Legend benefit on a failed C-grade expedition', () => {
    const result = applyExpeditionCallingRewards({
      year:2,
      month:6,
      calling:'vanguard',
      traits:[...vanguardTraits],
      signatures:[],
      legendRewardKeys:[],
      stageId:'forest_path',
      grade:'C',
      firstClear:false,
      discovery:null,
      regionCompleted:null,
      materialReward:0,
      fatigueDelta:8,
      stressDelta:6,
    });

    expect(result.fatigueDelta).toBe(8);
    expect(result.legendRewardKeys).toEqual([]);
    expect(result.applied).not.toContain('vanguard_legend');
  });
});
