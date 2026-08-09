import { describe, expect, it } from 'vitest';
import { astralRiftHonorProgress, newlyEarnedAstralRiftHonors } from './astral-rift-honors';
import type { AstralRiftRecordMap } from './astral-rift';

const record = (grade:'B'|'A'|'S'='A') => ({ grade, bestPower:100, clearCount:1 });

describe('Astral Rift honors', () => {
  it('counts unique cleared rifts, unique S rifts and cleared intensity combinations', () => {
    const records:AstralRiftRecordMap = {
      'nebula_garden:1':record('S'),
      'nebula_garden:2':record('A'),
      'lunar_ruins:1':record('B'),
    };
    expect(astralRiftHonorProgress(records)).toEqual({ clearedRifts:2, sRifts:1, clearedCombinations:3 });
  });

  it('unlocks first clear and all-six-rifts honors once', () => {
    const records:AstralRiftRecordMap = {
      'nebula_garden:1':record(), 'lunar_ruins:1':record(), 'comet_pass:1':record(),
      'eclipse_vault:1':record(), 'starforge_core:1':record(), 'empyrean_gate:1':record(),
    };
    expect(newlyEarnedAstralRiftHonors(records,[]).map(item => item.id)).toEqual(['first_rift_clear','six_rifts']);
    expect(newlyEarnedAstralRiftHonors(records,['first_rift_clear','six_rifts'])).toEqual([]);
  });

  it('unlocks six-rift S and all-18-combination honors at exact completion', () => {
    const ids = ['nebula_garden','lunar_ruins','comet_pass','eclipse_vault','starforge_core','empyrean_gate'] as const;
    const records:AstralRiftRecordMap = {};
    for (const id of ids) for (const intensity of [1,2,3] as const) records[`${id}:${intensity}`] = record('S');
    expect(newlyEarnedAstralRiftHonors(records,['first_rift_clear','six_rifts']).map(item => item.id)).toEqual(['six_rifts_s','full_intensity']);
  });
});
