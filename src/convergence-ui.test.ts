import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { convergenceUiSummary } from './convergence-ui';
import { convergenceWeeklyDirectives, convergenceWeeklyKey } from './convergence-weekly';

const richRiftRecords = {
  'nebula_garden:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'lunar_ruins:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'comet_pass:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'eclipse_vault:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'starforge_core:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'empyrean_gate:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'starforge_core:2':{ grade:'S' as const, bestPower:320, clearCount:1 },
};

describe('celestial convergence ui summary', () => {
  it('summarizes four guardians, twelve intensities and current sigils', () => {
    const summary = convergenceUiSummary({
      ...initialState,
      activeCalling:'vanguard',
      callingMastery:{ ...initialState.callingMastery, vanguard:18 },
      astralRiftRecords:richRiftRecords,
      purchasedAstralRiftRelics:['vanguard_seed','vanguard_core','vanguard_crown','arcane_seed','arcane_core','arcane_crown'],
      guardianSigils:17,
      celestialConvergenceRecords:{ 'dawn_stag:1':{ grade:'A', bestPower:301, clearCount:2 } },
    });
    expect(summary.sigils).toBe(17);
    expect(summary.guardians).toHaveLength(4);
    expect(summary.guardians.flatMap(item => item.intensities)).toHaveLength(12);
    expect(summary.guardians[0]).toEqual(expect.objectContaining({ id:'dawn_stag', power:expect.any(Number) }));
    expect(summary.guardians[0].intensities[0]).toEqual(expect.objectContaining({ available:true, grade:'A', bestPower:301, clearCount:2 }));
  });

  it('summarizes weekly directive progress and rewarded status', () => {
    const weekKey = convergenceWeeklyKey(initialState.year,initialState.month,initialState.week);
    const featured = convergenceWeeklyDirectives(initialState.year,initialState.month,initialState.week)[2].featuredGuardian!;
    const summary = convergenceUiSummary({
      ...initialState,
      convergenceWeeklyKey:weekKey,
      convergenceWeeklyProgress:{ convergence_clear:1, high_grade:1, featured_guardian:0 },
      rewardedConvergenceDirectives:[`${weekKey}:high_grade`],
    });
    expect(summary.directives).toEqual(expect.arrayContaining([
      expect.objectContaining({ id:'convergence_clear', current:1, rewarded:false }),
      expect.objectContaining({ id:'high_grade', current:1, rewarded:true }),
      expect.objectContaining({ id:'featured_guardian', current:0, featuredGuardian:featured }),
    ]));
  });

  it('summarizes sequential boons and honor progress', () => {
    const summary = convergenceUiSummary({
      ...initialState,
      guardianSigils:20,
      purchasedGuardianBoons:['dawn_oath'],
      celestialConvergenceRecords:{
        'dawn_stag:1':{ grade:'S', bestPower:300, clearCount:1 },
        'moon_crane:1':{ grade:'A', bestPower:300, clearCount:1 },
      },
      claimedConvergenceHonors:['first_convergence'],
    });
    expect(summary.boons.find(item => item.id === 'dawn_oath')).toEqual(expect.objectContaining({ purchased:true, canBuy:false }));
    expect(summary.boons.find(item => item.id === 'moon_oath')).toEqual(expect.objectContaining({ purchased:false, available:true, canBuy:true }));
    expect(summary.honors.find(item => item.id === 'first_convergence')).toEqual(expect.objectContaining({ claimed:true, current:1, target:1 }));
    expect(summary.honors.find(item => item.id === 'four_guardians')).toEqual(expect.objectContaining({ claimed:false, current:2, target:4 }));
  });
});
