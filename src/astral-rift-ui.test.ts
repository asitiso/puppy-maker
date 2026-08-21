import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { astralRiftUiSummary } from './astral-rift-ui';

describe('Astral Rift UI summary', () => {
  it('summarizes power, echo balance and six rifts with intensity availability', () => {
    const summary = astralRiftUiSummary({
      ...initialState,
      astralTrialRecords:[
        { key:'1-1:scholar_trial', grade:'S' as const, power:100 },
        { key:'1-2:wayfarer_trial', grade:'S' as const, power:100 },
        { key:'1-3:guardian_trial', grade:'S' as const, power:100 },
        { key:'1-4:crown_trial', grade:'S' as const, power:100 },
      ],
      astralRiftEchoes:27,
      astralRiftRecords:{ 'nebula_garden:1':{ grade:'A', bestPower:90, clearCount:2 } },
    });
    expect(summary.echoes).toBe(27);
    expect(summary.power).toBeGreaterThan(0);
    expect(summary.rifts).toHaveLength(6);
    const nebula = summary.rifts.find(item => item.id === 'nebula_garden')!;
    expect(nebula.intensities[0]).toEqual(expect.objectContaining({ intensity:1, available:true, grade:'A', bestPower:90 }));
    expect(nebula.intensities[1]).toEqual(expect.objectContaining({ intensity:2, available:true }));
  });

  it('exposes the next Celestial score target that unlocks new Rifts', () => {
    const summary = astralRiftUiSummary(initialState);
    expect(summary.nextUnlock).toEqual({
      threshold:12,
      remaining:12,
      riftIds:['nebula_garden','lunar_ruins'],
    });
  });

  it('summarizes weekly directives, relic purchase states and honors', () => {
    const summary = astralRiftUiSummary({
      ...initialState,
      astralRiftEchoes:40,
      purchasedAstralRiftRelics:['vanguard_seed'],
      astralRiftWeeklyKey:`${initialState.year}-${initialState.month}-${initialState.week}`,
      astralRiftWeeklyProgress:{ rift_clear:1, high_grade:1 },
      claimedAstralRiftHonors:['first_rift_clear'],
      astralRiftRecords:{ 'nebula_garden:1':{ grade:'S', bestPower:100, clearCount:1 } },
    });
    expect(summary.directives).toHaveLength(3);
    expect(summary.directives.find(item => item.id === 'rift_clear')).toEqual(expect.objectContaining({ current:1, target:2 }));
    expect(summary.relics.find(item => item.id === 'vanguard_seed')).toEqual(expect.objectContaining({ purchased:true, canBuy:false }));
    expect(summary.relics.find(item => item.id === 'vanguard_core')).toEqual(expect.objectContaining({ purchased:false, available:true, canBuy:true }));
    expect(summary.honors.find(item => item.id === 'first_rift_clear')).toEqual(expect.objectContaining({ claimed:true }));
  });
});
