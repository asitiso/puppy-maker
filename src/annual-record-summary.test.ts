import { describe, expect, it } from 'vitest';
import { latestAnnualRecord, annualRecordHeadline } from './annual-record-summary';
import type { AnnualRecord } from './annual-records';

const records: AnnualRecord[] = [
  { id:'year-1', year:1, trainings:10, outings:5, gifts:2, sGrades:1, bestScore:800, memories:5, skills:2, discoveries:3, seasonStamps:2, guardianRank:'junior' },
  { id:'year-2', year:2, trainings:24, outings:11, gifts:7, sGrades:4, bestScore:1320, memories:10, skills:4, discoveries:6, seasonStamps:4, guardianRank:'guardian' },
];

describe('annual record summary', () => {
  it('selects the newest historical record', () => {
    expect(latestAnnualRecord(records)?.id).toBe('year-2');
  });

  it('creates a compact guardian headline', () => {
    expect(annualRecordHeadline(records[1])).toBe('2년차 · 정식 수호자 · 최고점수 1,320');
  });

  it('returns no record for an empty history', () => {
    expect(latestAnnualRecord([])).toBeNull();
  });
});
