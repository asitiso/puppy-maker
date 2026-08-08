import { describe, expect, it } from 'vitest';
import { currentYearAmbitionRecord } from './yearly-ambition-progress';
import type { AnnualRecord } from './annual-records';

const previous: AnnualRecord = {
  id:'year-1', year:1, trainings:20, outings:6, gifts:4, sGrades:3, bestScore:700,
  memories:5, skills:2, discoveries:2, seasonStamps:2, guardianRank:'junior',
};

describe('current year ambition progress snapshot', () => {
  it('subtracts the latest annual baseline from cumulative career totals', () => {
    expect(currentYearAmbitionRecord({
      year:2,
      annualRecords:[previous],
      cumulative:{ trainings:27, outings:9, gifts:7, sGrades:5, bestScore:920, memories:8, skills:4, discoveries:4, seasonStamps:3, guardianRank:'guardian' },
    })).toEqual({
      id:'year-2-live', year:2, trainings:7, outings:3, gifts:3, sGrades:2, bestScore:920,
      memories:3, skills:2, discoveries:2, seasonStamps:1, guardianRank:'guardian',
    });
  });

  it('uses cumulative values directly when no previous annual record exists', () => {
    const live = currentYearAmbitionRecord({
      year:1,
      annualRecords:[],
      cumulative:{ trainings:4, outings:2, gifts:1, sGrades:1, bestScore:500, memories:2, skills:1, discoveries:1, seasonStamps:1, guardianRank:'trainee' },
    });
    expect(live.trainings).toBe(4);
    expect(live.memories).toBe(2);
    expect(live.seasonStamps).toBe(1);
  });
});
