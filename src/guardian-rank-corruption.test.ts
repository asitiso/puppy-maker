import { describe, expect, it } from 'vitest';
import { guardianGrowthPoints, guardianRank } from './guardian-rank';

describe('guardian rank damaged mastery defense', () => {
  it('ignores non-finite mastery instead of bypassing rank thresholds', () => {
    const points = guardianGrowthPoints({ memories:0, skills:0, discoveries:0, masteryLevels:[Number.POSITIVE_INFINITY, Number.NaN] });
    expect(points).toBe(0);
    expect(guardianRank(points)).toBe('trainee');
  });

  it('caps malformed mastery levels at the real level-five ceiling', () => {
    const points = guardianGrowthPoints({ memories:0, skills:0, discoveries:0, masteryLevels:[999, 5] });
    expect(points).toBe(8);
    expect(guardianRank(points)).toBe('junior');
  });

  it('keeps guardian rank helpers finite for damaged aggregate progress', () => {
    const points = guardianGrowthPoints({ memories:Number.NaN, skills:Number.POSITIVE_INFINITY, discoveries:-20, masteryLevels:[-10, 3.9] });
    expect(points).toBe(2);
    expect(Number.isFinite(points)).toBe(true);
  });
});
