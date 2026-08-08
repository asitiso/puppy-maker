import { describe, expect, it } from 'vitest';
import { ambitionDefinitions, ambitionProgress, defaultYearlyAmbition } from './yearly-ambitions';
import type { AnnualRecord } from './annual-records';

function record(overrides: Partial<AnnualRecord> = {}): AnnualRecord {
  return {
    id:'year-1', year:1, trainings:0, outings:0, gifts:0, sGrades:0, bestScore:0,
    memories:0, skills:0, discoveries:0, seasonStamps:0, guardianRank:'trainee',
    ...overrides,
  };
}

describe('yearly ambitions', () => {
  it('defines four distinct year-long play styles', () => {
    expect(ambitionDefinitions.map(item => item.id)).toEqual(['training','exploration','bond','season']);
    expect(new Set(ambitionDefinitions.map(item => item.label)).size).toBe(4);
  });

  it('defaults a new year to training ambition', () => {
    expect(defaultYearlyAmbition()).toBe('training');
  });

  it('calculates bounded progress for each ambition from the annual record', () => {
    expect(ambitionProgress('training', record({ trainings:24, sGrades:6 }))).toEqual({ current:30, target:30, percent:100, complete:true });
    expect(ambitionProgress('exploration', record({ outings:8, discoveries:4 }))).toEqual({ current:16, target:20, percent:80, complete:false });
    expect(ambitionProgress('bond', record({ gifts:8, memories:8 }))).toEqual({ current:16, target:18, percent:89, complete:false });
    expect(ambitionProgress('season', record({ seasonStamps:4 }))).toEqual({ current:4, target:4, percent:100, complete:true });
  });

  it('keeps the seasonal ambition repeatable in later years through steady outings', () => {
    expect(ambitionProgress('season', record({ seasonStamps:0, outings:12 }))).toEqual({ current:4, target:4, percent:100, complete:true });
    expect(ambitionProgress('season', record({ seasonStamps:0, outings:7 }))).toEqual({ current:2, target:4, percent:50, complete:false });
  });
});
