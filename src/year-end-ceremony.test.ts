import { describe, expect, it } from 'vitest';
import { ceremonyRecord, shouldShowYearEndCeremony } from './year-end-ceremony';
import type { AnnualRecord } from './annual-records';

const record: AnnualRecord = {
  id:'year-1', year:1, trainings:12, outings:8, gifts:4, sGrades:3, bestScore:1250,
  memories:9, skills:3, discoveries:5, seasonStamps:4, guardianRank:'guardian',
};

describe('year-end guardian ceremony', () => {
  it('shows in january for the immediately completed year', () => {
    expect(shouldShowYearEndCeremony({ year:2, month:1, annualRecords:[record] }, [])).toBe(true);
  });

  it('does not show outside january', () => {
    expect(shouldShowYearEndCeremony({ year:2, month:2, annualRecords:[record] }, [])).toBe(false);
  });

  it('does not show a record already acknowledged', () => {
    expect(shouldShowYearEndCeremony({ year:2, month:1, annualRecords:[record] }, ['year-1'])).toBe(false);
  });

  it('selects the immediately previous annual record', () => {
    expect(ceremonyRecord({ year:2, month:1, annualRecords:[record] })?.id).toBe('year-1');
  });
});
