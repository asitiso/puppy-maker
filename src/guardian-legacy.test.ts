import { describe, expect, it } from 'vitest';
import { guardianLegacy, legacyPoints } from './guardian-legacy';
import type { AnnualRecord } from './annual-records';

const record = (year:number, overrides:Partial<AnnualRecord> = {}): AnnualRecord => ({
  id:`year-${year}`, year, trainings:8, outings:6, gifts:3, sGrades:1, bestScore:850,
  memories:7, skills:2, discoveries:3, seasonStamps:2, guardianRank:'junior', ...overrides,
});

describe('guardian legacy', () => {
  it('starts as a new chronicle before the first completed year', () => {
    expect(legacyPoints([])).toBe(0);
    expect(guardianLegacy([]).id).toBe('new_chronicle');
  });

  it('rewards completed years and exceptional annual honors', () => {
    const records = [record(1, { seasonStamps:4 }), record(2, { trainings:18, sGrades:5, bestScore:1300 })];
    expect(legacyPoints(records)).toBe(30);
  });

  it('advances through long-term legacy ranks', () => {
    expect(guardianLegacy([record(1)]).id).toBe('first_page');
    expect(guardianLegacy([record(1), record(2), record(3)]).id).toBe('living_legend');
  });

  it('returns progress toward the next legacy rank', () => {
    const legacy = guardianLegacy([record(1)]);
    expect(legacy.next?.id).toBe('seasoned_chronicle');
    expect(legacy.next?.remaining).toBeGreaterThan(0);
  });
});
