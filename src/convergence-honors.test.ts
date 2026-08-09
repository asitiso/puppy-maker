import { describe, expect, it } from 'vitest';
import { newlyEarnedConvergenceHonors } from './convergence-honors';
import type { ConvergenceRecordMap } from './celestial-convergence';

const record = (grade:'B'|'A'|'S'='A') => ({ grade, bestPower:300, clearCount:1 });

describe('convergence honors', () => {
  it('awards first clear once', () => {
    const records:ConvergenceRecordMap = { 'dawn_stag:1':record() };
    expect(newlyEarnedConvergenceHonors(records,[]).map(item => item.id)).toEqual(['first_convergence']);
    expect(newlyEarnedConvergenceHonors(records,['first_convergence'])).toEqual([]);
  });

  it('awards four-guardian honor when every guardian has a clear', () => {
    const records:ConvergenceRecordMap = {
      'dawn_stag:1':record(), 'moon_crane:1':record(), 'storm_wolf:1':record(), 'star_fox:1':record(),
    };
    expect(newlyEarnedConvergenceHonors(records,['first_convergence']).map(item => item.id)).toContain('four_guardians');
  });

  it('awards intensity-three quartet and all-S honors at endgame completion', () => {
    const guardians = ['dawn_stag','moon_crane','storm_wolf','star_fox'] as const;
    const records:ConvergenceRecordMap = {};
    for (const guardian of guardians) {
      for (const intensity of [1,2,3] as const) records[`${guardian}:${intensity}`] = record('S');
    }
    expect(newlyEarnedConvergenceHonors(records,['first_convergence','four_guardians']).map(item => item.id)).toEqual(['intensity_three_quartet','all_s_convergence']);
  });

  it('does not grant all-S when even one record is below S', () => {
    const guardians = ['dawn_stag','moon_crane','storm_wolf','star_fox'] as const;
    const records:ConvergenceRecordMap = {};
    for (const guardian of guardians) for (const intensity of [1,2,3] as const) records[`${guardian}:${intensity}`] = record('S');
    records['star_fox:3'] = record('A');
    expect(newlyEarnedConvergenceHonors(records,['first_convergence','four_guardians']).map(item => item.id)).toEqual(['intensity_three_quartet']);
  });
});
