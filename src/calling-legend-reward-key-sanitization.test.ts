import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards, applyPathfinderOutingLegend } from './calling-depth-effects';

describe('Calling legend reward key sanitation', () => {
  it('deduplicates string keys and drops malformed entries on expedition rewards', () => {
    const result = applyExpeditionCallingRewards({
      year:2026,
      month:8,
      calling:null,
      traits:[],
      signatures:[],
      legendRewardKeys:['2026-8:vanguard_legend','2026-8:vanguard_legend',null,42,'','legacy:unknown'] as any,
      stageId:'forest_path',
      grade:'C',
      firstClear:false,
      discovery:null,
      regionCompleted:null,
      materialReward:0,
      fatigueDelta:0,
      stressDelta:0,
    });

    expect(result.legendRewardKeys).toEqual(['2026-8:vanguard_legend','legacy:unknown']);
  });

  it('sanitizes existing keys even when Pathfinder legend does not apply', () => {
    const result = applyPathfinderOutingLegend(
      2026,
      8,
      null,
      [],
      false,
      ['2026-8:pathfinder_legend','2026-8:pathfinder_legend',null,7,''] as any,
    );

    expect(result.applied).toBe(false);
    expect(result.goldBonus).toBe(0);
    expect(result.legendRewardKeys).toEqual(['2026-8:pathfinder_legend']);
  });
});