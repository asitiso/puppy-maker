import { describe, expect, it } from 'vitest';
import { annualEpilogue } from './annual-epilogues';
import type { AnnualRecord } from './annual-records';

const base: AnnualRecord = {
  id:'year-1', year:1, trainings:8, outings:6, gifts:3, sGrades:1, bestScore:850,
  memories:7, skills:2, discoveries:3, seasonStamps:2, guardianRank:'junior',
};

describe('annual epilogue', () => {
  it('remembers a four-season journey', () => {
    expect(annualEpilogue({ ...base, seasonStamps:4 }).title).toBe('네 계절을 함께 걸은 해');
  });

  it('reflects a training-focused year', () => {
    expect(annualEpilogue({ ...base, trainings:18, sGrades:5, bestScore:1300 }).title).toBe('강해지는 법을 배운 해');
  });

  it('reflects an exploration-focused year', () => {
    expect(annualEpilogue({ ...base, outings:16, discoveries:6 }).title).toBe('세상을 넓게 바라본 해');
  });

  it('reflects a bond-focused year', () => {
    expect(annualEpilogue({ ...base, gifts:10, memories:12 }).title).toBe('마음이 가까워진 해');
  });

  it('has a balanced fallback story', () => {
    expect(annualEpilogue(base).title).toBe('천천히 단단해진 해');
  });
});
