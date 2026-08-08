import { describe, expect, it } from 'vitest';
import { annualHonor } from './annual-honors';
import type { AnnualRecord } from './annual-records';

const base: AnnualRecord = {
  id:'year-1', year:1, trainings:8, outings:6, gifts:3, sGrades:1, bestScore:850,
  memories:7, skills:2, discoveries:3, seasonStamps:2, guardianRank:'junior',
};

describe('annual guardian honors', () => {
  it('prioritizes a four-season completion honor', () => {
    expect(annualHonor({ ...base, seasonStamps:4 }).id).toBe('four_seasons');
  });

  it('recognizes a training-focused year', () => {
    expect(annualHonor({ ...base, trainings:18, sGrades:5, bestScore:1300 }).id).toBe('training_ace');
  });

  it('recognizes an exploration-focused year', () => {
    expect(annualHonor({ ...base, outings:16, discoveries:6 }).id).toBe('trailblazer');
  });

  it('recognizes a bond-focused year', () => {
    expect(annualHonor({ ...base, gifts:10, memories:12 }).id).toBe('heart_keeper');
  });

  it('falls back to a balanced growth honor', () => {
    expect(annualHonor(base).id).toBe('balanced_guardian');
  });
});
