import { describe, expect, it } from 'vitest';
import { guardianGrowthPoints, guardianRank, nextGuardianRank } from './guardian-rank';

describe('guardian rank rules', () => {
  it('calculates points from memories skills discoveries and mastery', () => {
    expect(guardianGrowthPoints({ memories: 3, skills: 2, discoveries: 4, masteryLevels: [1, 2, 4, 1] })).toBe(15);
  });

  it('normalizes malformed and fractional progress before calculating rank points', () => {
    expect(guardianGrowthPoints({ memories:Number.POSITIVE_INFINITY, skills:Number.NaN, discoveries:-3, masteryLevels:[Number.POSITIVE_INFINITY, 2.9, -1, Number.NaN] })).toBe(1);
    expect(guardianGrowthPoints({ memories:3.9, skills:2.9, discoveries:4.9, masteryLevels:[1.9,2.9,4.9,1] })).toBe(15);
  });

  it('maps stable guardian rank thresholds', () => {
    expect(guardianRank(0)).toBe('trainee');
    expect(guardianRank(7)).toBe('trainee');
    expect(guardianRank(8)).toBe('junior');
    expect(guardianRank(15)).toBe('junior');
    expect(guardianRank(16)).toBe('guardian');
    expect(guardianRank(27)).toBe('guardian');
    expect(guardianRank(28)).toBe('veteran');
    expect(guardianRank(41)).toBe('veteran');
    expect(guardianRank(42)).toBe('starlight');
  });

  it('treats malformed direct rank points as zero', () => {
    expect(guardianRank(Number.NaN)).toBe('trainee');
    expect(guardianRank(Number.POSITIVE_INFINITY)).toBe('trainee');
    expect(guardianRank(-5)).toBe('trainee');
    expect(guardianRank(8.9)).toBe('junior');
  });

  it('returns the next rank and threshold until max rank', () => {
    expect(nextGuardianRank(7)).toEqual({ rank: 'junior', threshold: 8 });
    expect(nextGuardianRank(8)).toEqual({ rank: 'guardian', threshold: 16 });
    expect(nextGuardianRank(30)).toEqual({ rank: 'starlight', threshold: 42 });
    expect(nextGuardianRank(42)).toBeNull();
  });

  it('keeps malformed direct points at the first progression boundary', () => {
    expect(nextGuardianRank(Number.NaN)).toEqual({ rank:'junior', threshold:8 });
    expect(nextGuardianRank(Number.POSITIVE_INFINITY)).toEqual({ rank:'junior', threshold:8 });
    expect(nextGuardianRank(-3)).toEqual({ rank:'junior', threshold:8 });
  });
});
