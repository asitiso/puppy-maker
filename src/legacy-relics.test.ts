import { describe, expect, it } from 'vitest';
import { unlockedLegacyRelics } from './legacy-relics';
import type { AnnualRecord } from './annual-records';

const record = (year:number, overrides:Partial<AnnualRecord> = {}): AnnualRecord => ({
  id:`year-${year}`, year, trainings:8, outings:6, gifts:3, sGrades:1, bestScore:850,
  memories:7, skills:2, discoveries:3, seasonStamps:2, guardianRank:'junior', ...overrides,
});

describe('legacy relic collection', () => {
  it('unlocks the first-year relic after one completed year', () => {
    expect(unlockedLegacyRelics([record(1)])).toContain('first_chronicle');
  });

  it('unlocks the seasonal crown from a four-season year', () => {
    expect(unlockedLegacyRelics([record(1, { seasonStamps:4 })])).toContain('seasonal_crown');
  });

  it('unlocks the three-year seal after three annual records', () => {
    expect(unlockedLegacyRelics([record(1), record(2), record(3)])).toContain('three_year_seal');
  });

  it('unlocks the prism when three different annual honors were earned', () => {
    const records = [
      record(1, { trainings:18, sGrades:5, bestScore:1300 }),
      record(2, { outings:16, discoveries:6 }),
      record(3, { gifts:10, memories:12 }),
    ];
    expect(unlockedLegacyRelics(records)).toContain('honor_prism');
  });

  it('unlocks the starlight chronicle after five completed years', () => {
    const records = [1,2,3,4,5].map(year => record(year));
    expect(unlockedLegacyRelics(records)).toContain('starlight_chronicle');
  });
});
