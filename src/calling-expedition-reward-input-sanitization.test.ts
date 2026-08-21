import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards, applyPathfinderOutingLegend } from './calling-depth-effects';

const base = () => ({
  year:2026,
  month:8,
  calling:'pathfinder' as const,
  traits:[] as any[],
  signatures:['trail_reading'] as any[],
  legendRewardKeys:[],
  stageId:'forest_path' as const,
  grade:'A' as const,
  firstClear:true,
  discovery:null,
  regionCompleted:null,
  materialReward:1,
  fatigueDelta:0,
  stressDelta:0,
});

describe('Calling expedition reward input sanitation', () => {
  it('does not grant trail reading from malformed material rewards', () => {
    for (const materialReward of [Number.POSITIVE_INFINITY, Number.NaN, -1]) {
      const result = applyExpeditionCallingRewards({ ...base(), materialReward });
      expect(result.extraMaterial).toBe(0);
      expect(result.applied).not.toContain('trail_reading');
    }
  });

  it('fails closed for malformed grades instead of applying successful-clear rewards', () => {
    for (const grade of ['Z', '', null, undefined, 42] as any[]) {
      const result = applyExpeditionCallingRewards({ ...base(), grade } as any);
      expect(result.extraMaterial).toBe(0);
      expect(result.applied).not.toContain('trail_reading');
    }
  });

  it('requires firstClear to be the literal boolean true for first-clear Calling rewards', () => {
    for (const firstClear of ['yes', 1, {}, [], 'true'] as any[]) {
      const pathfinder = applyExpeditionCallingRewards({ ...base(), firstClear } as any);
      expect(pathfinder.extraMaterial).toBe(0);
      expect(pathfinder.applied).not.toContain('trail_reading');

      const vanguard = applyExpeditionCallingRewards({
        ...base(),
        calling:'vanguard',
        traits:['vanguard_legend'],
        signatures:[],
        firstClear,
        fatigueDelta:5,
      } as any);
      expect(vanguard.fatigueDelta).toBe(5);
      expect(vanguard.applied).not.toContain('vanguard_legend');
    }
  });

  it('requires Pathfinder outing discovery evidence to be the literal boolean true', () => {
    for (const discovered of ['yes', 1, {}, [], 'true'] as any[]) {
      const result = applyPathfinderOutingLegend(
        2026,
        8,
        'pathfinder',
        ['pathfinder_legend'],
        discovered,
        [],
      );
      expect(result.goldBonus).toBe(0);
      expect(result.applied).toBe(false);
      expect(result.legendRewardKeys).toEqual([]);
    }
  });
});