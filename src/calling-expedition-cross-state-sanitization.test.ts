import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards } from './calling-depth-effects';

describe('Calling expedition cross-state sanitation', () => {
  it('does not grant star compass from malformed region completion evidence', () => {
    for (const regionCompleted of ['stale_region', 42, true] as any[]) {
      const result = applyExpeditionCallingRewards({
        year:2026, month:8, calling:'pathfinder', traits:[], signatures:['star_compass'], legendRewardKeys:[],
        stageId:'forest_guardian', grade:'A', firstClear:false, discovery:null,
        regionCompleted, materialReward:0, fatigueDelta:0, stressDelta:0,
      } as any);
      expect(result.extraMaterial).toBe(0);
      expect(result.applied).not.toContain('star_compass');
    }
  });

  it('does not grant Arcanist legend from malformed discovery evidence', () => {
    for (const discovery of [42, true, {}, []] as any[]) {
      const result = applyExpeditionCallingRewards({
        year:2026, month:8, calling:'arcanist', traits:['arcanist_legend'], signatures:[], legendRewardKeys:[],
        stageId:'city_square', grade:'A', firstClear:false, discovery,
        regionCompleted:null, materialReward:1, fatigueDelta:0, stressDelta:6,
      } as any);
      expect(result.stressDelta).toBe(6);
      expect(result.applied).not.toContain('arcanist_legend');
      expect(result.legendRewardKeys).not.toContain('2026-8:arcanist_legend');
    }
  });
});