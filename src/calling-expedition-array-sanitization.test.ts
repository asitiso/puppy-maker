import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards, applyPathfinderOutingLegend, effectivePathfinderExplorationXp } from './calling-depth-effects';

describe('Calling expedition array sanitation', () => {
  it('treats malformed traits and signatures as empty collections', () => {
    expect(() => applyExpeditionCallingRewards({
      year:2026,
      month:8,
      calling:'pathfinder',
      traits:null,
      signatures:null,
      legendRewardKeys:null,
      stageId:'forest_path',
      grade:'A',
      firstClear:true,
      discovery:null,
      regionCompleted:null,
      materialReward:1,
      fatigueDelta:0,
      stressDelta:0,
    } as any)).not.toThrow();

    const result = applyExpeditionCallingRewards({
      year:2026,
      month:8,
      calling:'pathfinder',
      traits:null,
      signatures:null,
      legendRewardKeys:null,
      stageId:'forest_path',
      grade:'A',
      firstClear:true,
      discovery:null,
      regionCompleted:null,
      materialReward:1,
      fatigueDelta:0,
      stressDelta:0,
    } as any);
    expect(result.extraMaterial).toBe(0);
    expect(result.applied).toEqual([]);
    expect(result.legendRewardKeys).toEqual([]);
  });

  it('treats malformed Pathfinder trait lists as empty', () => {
    expect(effectivePathfinderExplorationXp(3, 'pathfinder', null as any)).toBe(3);
    expect(applyPathfinderOutingLegend(2026, 8, 'pathfinder', null as any, true, [])).toEqual({
      goldBonus:0,
      legendRewardKeys:[],
      applied:false,
    });
  });
});