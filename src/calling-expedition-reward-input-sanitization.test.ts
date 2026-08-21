import { describe, expect, it } from 'vitest';
import { applyExpeditionCallingRewards } from './calling-depth-effects';

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
});