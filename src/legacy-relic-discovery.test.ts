import { describe, expect, it } from 'vitest';
import { newlyUnlockedLegacyRelics } from './legacy-relic-discovery';
import type { AnnualRecord } from './annual-records';

const record = (year:number, overrides:Partial<AnnualRecord> = {}): AnnualRecord => ({
  id:`year-${year}`, year, trainings:8, outings:6, gifts:3, sGrades:1, bestScore:850,
  memories:7, skills:2, discoveries:3, seasonStamps:2, guardianRank:'junior', ...overrides,
});

describe('legacy relic discovery at year end', () => {
  it('reveals the first chronicle on the first completed year', () => {
    expect(newlyUnlockedLegacyRelics([record(1)], 'year-1')).toEqual(['first_chronicle']);
  });

  it('can reveal multiple relics from one exceptional first year', () => {
    expect(newlyUnlockedLegacyRelics([record(1, { seasonStamps:4 })], 'year-1')).toEqual(['first_chronicle','seasonal_crown']);
  });

  it('reveals only relics added by the selected annual record', () => {
    const records = [record(1), record(2), record(3)];
    expect(newlyUnlockedLegacyRelics(records, 'year-3')).toEqual(['three_year_seal']);
  });

  it('returns nothing for an unknown record id', () => {
    expect(newlyUnlockedLegacyRelics([record(1)], 'year-9')).toEqual([]);
  });
});
