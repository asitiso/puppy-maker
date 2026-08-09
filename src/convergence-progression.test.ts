import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { convergenceWeeklyDirectives, convergenceWeeklyKey } from './convergence-weekly';

const readyRiftRecords = () => ({
  'nebula_garden:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'lunar_ruins:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'comet_pass:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'eclipse_vault:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'starforge_core:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'empyrean_gate:1':{ grade:'S' as const, bestPower:300, clearCount:20 },
  'starforge_core:2':{ grade:'S' as const, bestPower:320, clearCount:1 },
});

const convergenceReady = () => ({
  ...initialState,
  activeCalling:'vanguard' as const,
  callingMastery:{ ...initialState.callingMastery, vanguard:18 },
  astralRiftRecords:readyRiftRecords(),
  purchasedAstralRiftRelics:[
    'vanguard_seed','vanguard_core','vanguard_crown','arcane_seed','arcane_core','arcane_crown',
  ] as typeof initialState.purchasedAstralRiftRelics,
});

describe('celestial convergence progression', () => {
  it('hydrates and sanitizes persistent convergence state', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      celestialConvergenceRecords:{
        'dawn_stag:1':{ grade:'A', bestPower:311.8, clearCount:2.9 },
        'bad:9':{ grade:'S', bestPower:999, clearCount:1 },
        'moon_crane:1':{ grade:'C', bestPower:-2, clearCount:0 },
      },
      guardianSigils:-7,
      purchasedGuardianBoons:['dawn_oath','bad','dawn_oath'],
      convergenceWeeklyKey:'2-5-3',
      convergenceWeeklyProgress:{ convergence_clear:99, bad:4 },
      rewardedConvergenceDirectives:['2-5-3:high_grade','bad'],
      claimedConvergenceHonors:['first_convergence','bad','first_convergence'],
    });
    expect(hydrated.celestialConvergenceRecords).toEqual({ 'dawn_stag:1':{ grade:'A', bestPower:311, clearCount:2 } });
    expect(hydrated.guardianSigils).toBe(0);
    expect(hydrated.purchasedGuardianBoons).toEqual(['dawn_oath']);
    expect(hydrated.convergenceWeeklyKey).toBe('2-5-3');
    expect(hydrated.convergenceWeeklyProgress).toEqual({ convergence_clear:2 });
    expect(hydrated.rewardedConvergenceDirectives).toEqual(['2-5-3:high_grade']);
    expect(hydrated.claimedConvergenceHonors).toEqual(['first_convergence']);
  });

  it('rejects locked convergence without mutating state', () => {
    const next = reducer(initialState,{ type:'CLEAR_CELESTIAL_CONVERGENCE', guardianId:'dawn_stag', intensity:1 });
    expect(next).toBe(initialState);
  });

  it('clears a guardian challenge, grants sigils, weekly rewards and first honor once', () => {
    const ready = convergenceReady();
    const weekKey = convergenceWeeklyKey(ready.year,ready.month,ready.week);
    const directives = convergenceWeeklyDirectives(ready.year,ready.month,ready.week);
    const isolated = {
      ...ready,
      rewardedConvergenceDirectives:[
        `${weekKey}:high_grade`,
        `${weekKey}:featured_guardian`,
      ],
    };
    const next = reducer(isolated,{ type:'CLEAR_CELESTIAL_CONVERGENCE', guardianId:'dawn_stag', intensity:1 });
    expect(next.celestialConvergenceRecords['dawn_stag:1']).toEqual(expect.objectContaining({ grade:'S', clearCount:1 }));
    expect(next.guardianSigils).toBe(8);
    expect(next.convergenceWeeklyKey).toBe(weekKey);
    expect(next.convergenceWeeklyProgress.convergence_clear).toBe(1);
    expect(next.claimedConvergenceHonors).toEqual(['first_convergence']);
    expect(next.gold).toBe(isolated.gold + 500);

    const replay = reducer(next,{ type:'CLEAR_CELESTIAL_CONVERGENCE', guardianId:'dawn_stag', intensity:1 });
    expect(replay.celestialConvergenceRecords['dawn_stag:1'].clearCount).toBe(2);
    expect(replay.claimedConvergenceHonors).toEqual(['first_convergence']);
    expect(replay.gold).toBe(next.gold);
  });

  it('purchases Guardian Boons with sigils and rejects duplicate or locked purchases', () => {
    const ready = { ...initialState, guardianSigils:20 };
    const bought = reducer(ready,{ type:'PURCHASE_GUARDIAN_BOON', boonId:'dawn_oath' });
    expect(bought.guardianSigils).toBe(15);
    expect(bought.purchasedGuardianBoons).toEqual(['dawn_oath']);
    expect(bought.gold).toBe(ready.gold + 200);
    expect(reducer(bought,{ type:'PURCHASE_GUARDIAN_BOON', boonId:'dawn_oath' })).toBe(bought);
    expect(reducer(ready,{ type:'PURCHASE_GUARDIAN_BOON', boonId:'moon_oath' })).toBe(ready);
  });

  it('preserves convergence progression across base game transitions', () => {
    const state = {
      ...initialState,
      screen:'result' as const,
      guardianSigils:27,
      purchasedGuardianBoons:['dawn_oath'] as typeof initialState.purchasedGuardianBoons,
      celestialConvergenceRecords:{ 'dawn_stag:1':{ grade:'A' as const, bestPower:270, clearCount:2 } },
      claimedConvergenceHonors:['first_convergence'] as typeof initialState.claimedConvergenceHonors,
    };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.guardianSigils).toBe(27);
    expect(next.purchasedGuardianBoons).toEqual(['dawn_oath']);
    expect(next.celestialConvergenceRecords).toEqual(state.celestialConvergenceRecords);
    expect(next.claimedConvergenceHonors).toEqual(['first_convergence']);
  });
});
