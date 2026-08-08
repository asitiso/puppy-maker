import { describe, expect, it } from 'vitest';
import { completedYearAmbition } from './yearly-ambition-history';
import type { AnnualRecord } from './annual-records';

const year1: AnnualRecord = {
  id:'year-1', year:1, trainings:18, outings:6, gifts:5, sGrades:4, bestScore:760,
  memories:5, skills:2, discoveries:2, seasonStamps:2, guardianRank:'junior',
};
const year2: AnnualRecord = {
  id:'year-2', year:2, trainings:43, outings:9, gifts:7, sGrades:9, bestScore:940,
  memories:8, skills:4, discoveries:3, seasonStamps:3, guardianRank:'guardian',
};

describe('completed yearly ambition history', () => {
  it('evaluates a completed year from that years delta rather than lifetime totals', () => {
    const result = completedYearAmbition([year1, year2], { 2:'training' }, 2);
    expect(result?.progress).toEqual({ current:30, target:30, percent:100, complete:true });
    expect(result?.definition.id).toBe('training');
  });

  it('keeps incomplete ambitions visible in history', () => {
    const result = completedYearAmbition([year1, year2], { 2:'bond' }, 2);
    expect(result?.progress.complete).toBe(false);
    expect(result?.progress.current).toBe(5);
  });

  it('returns null when the year had no selected ambition or no annual record', () => {
    expect(completedYearAmbition([year1], {}, 1)).toBeNull();
    expect(completedYearAmbition([year1], { 2:'training' }, 2)).toBeNull();
  });
});
