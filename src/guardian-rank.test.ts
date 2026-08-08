import { describe, expect, it } from 'vitest';
import { guardianGrowthPoints, guardianRank, nextGuardianRank } from './guardian-rank';

describe('guardian rank rules', () => {
  it('calculates points from memories skills discoveries and mastery', () => {
    expect(guardianGrowthPoints({ memories: 3, skills: 2, discoveries: 4, masteryLevels: [1, 2, 4, 1] })).toBe(15);
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

  it('returns the next rank and threshold until max rank', () => {
    expect(nextGuardianRank(7)).toEqual({ rank: 'junior', threshold: 8 });
    expect(nextGuardianRank(8)).toEqual({ rank: 'guardian', threshold: 16 });
    expect(nextGuardianRank(30)).toEqual({ rank: 'starlight', threshold: 42 });
    expect(nextGuardianRank(42)).toBeNull();
  });
});
