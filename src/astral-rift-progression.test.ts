import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { astralRiftWeeklyKey } from './astral-rift-weekly';

const celestialReady = () => ({
  ...initialState,
  activeCalling:'vanguard' as const,
  callingMastery:{ ...initialState.callingMastery, vanguard:18 },
  purchasedAstralBlessings:['scholar_glow','wayfarer_wind','guardian_aegis','crown_grace'] as typeof initialState.purchasedAstralBlessings,
  astralTrialRecords:[
    { key:'1-1:scholar_trial', grade:'S' as const, power:100 },
    { key:'1-2:wayfarer_trial', grade:'S' as const, power:100 },
    { key:'1-3:guardian_trial', grade:'S' as const, power:100 },
    { key:'1-4:crown_trial', grade:'S' as const, power:100 },
  ],
});

describe('Astral Rift reducer progression', () => {
  it('hydrates and sanitizes persistent Rift state', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      astralRiftRecords:{
        'nebula_garden:1':{ grade:'A', bestPower:91.8, clearCount:2.9 },
        'bad:9':{ grade:'S', bestPower:999, clearCount:1 },
        'lunar_ruins:1':{ grade:'C', bestPower:-5, clearCount:0 },
      },
      astralRiftEchoes:-9,
      purchasedAstralRiftRelics:['vanguard_seed','bad','vanguard_seed'],
      astralRiftWeeklyKey:'2-5-3',
      astralRiftWeeklyProgress:{ rift_clear:99, bad:4 },
      rewardedAstralRiftDirectives:['2-5-3:high_grade','bad'],
      claimedAstralRiftHonors:['first_rift_clear','bad','first_rift_clear'],
    });
    expect(hydrated.astralRiftRecords).toEqual({ 'nebula_garden:1':{ grade:'A', bestPower:91, clearCount:2 } });
    expect(hydrated.astralRiftEchoes).toBe(0);
    expect(hydrated.purchasedAstralRiftRelics).toEqual(['vanguard_seed']);
    expect(hydrated.astralRiftWeeklyKey).toBe('2-5-3');
    expect(hydrated.astralRiftWeeklyProgress).toEqual({ rift_clear:2 });
    expect(hydrated.rewardedAstralRiftDirectives).toEqual(['2-5-3:high_grade']);
    expect(hydrated.claimedAstralRiftHonors).toEqual(['first_rift_clear']);
  });

  it('clears an unlocked Rift, stores the record, pays echoes and first-clear honor once', () => {
    const ready = celestialReady();
    const weekKey = astralRiftWeeklyKey(ready.year,ready.month,ready.week);
    const isolated = {
      ...ready,
      rewardedAstralRiftDirectives:[`${weekKey}:rift_clear`,`${weekKey}:high_grade`,`${weekKey}:featured_rift`],
    };
    const next = reducer(isolated,{ type:'CLEAR_ASTRAL_RIFT', riftId:'nebula_garden', intensity:1 });
    expect(next.astralRiftRecords['nebula_garden:1']).toEqual(expect.objectContaining({ grade:'S', clearCount:1 }));
    expect(next.astralRiftEchoes).toBe(11);
    expect(next.claimedAstralRiftHonors).toEqual(['first_rift_clear']);
    expect(next.gold).toBe(isolated.gold + 250);

    const replay = reducer(next,{ type:'CLEAR_ASTRAL_RIFT', riftId:'nebula_garden', intensity:1 });
    expect(replay.astralRiftRecords['nebula_garden:1'].clearCount).toBe(2);
    expect(replay.astralRiftEchoes).toBe(19);
    expect(replay.gold).toBe(next.gold);
  });

  it('rejects locked or failed Rift clears without mutating state', () => {
    const locked = reducer(initialState,{ type:'CLEAR_ASTRAL_RIFT', riftId:'empyrean_gate', intensity:1 });
    expect(locked).toBe(initialState);

    const lowPower = {
      ...initialState,
      astralTrialRecords:Array.from({ length:6 },(_,index) => ({ key:`1-${index + 1}:scholar_trial`, grade:'B' as const, power:20 })),
    };
    const failed = reducer(lowPower,{ type:'CLEAR_ASTRAL_RIFT', riftId:'nebula_garden', intensity:1 });
    expect(failed).toBe(lowPower);
  });

  it('buys Rift relics with Echoes and returns the same object for duplicate/invalid purchases', () => {
    const ready = { ...initialState, astralRiftEchoes:40 };
    const bought = reducer(ready,{ type:'PURCHASE_ASTRAL_RIFT_RELIC', relicId:'vanguard_seed' });
    expect(bought.astralRiftEchoes).toBe(25);
    expect(bought.purchasedAstralRiftRelics).toEqual(['vanguard_seed']);
    expect(reducer(bought,{ type:'PURCHASE_ASTRAL_RIFT_RELIC', relicId:'vanguard_seed' })).toBe(bought);
    expect(reducer(ready,{ type:'PURCHASE_ASTRAL_RIFT_RELIC', relicId:'vanguard_core' })).toBe(ready);
  });

  it('preserves Rift progression across month transitions', () => {
    const state = {
      ...initialState,
      screen:'result' as const,
      astralRiftEchoes:33,
      purchasedAstralRiftRelics:['vanguard_seed'] as typeof initialState.purchasedAstralRiftRelics,
      astralRiftRecords:{ 'nebula_garden:1':{ grade:'A' as const, bestPower:80, clearCount:2 } },
      claimedAstralRiftHonors:['first_rift_clear'] as typeof initialState.claimedAstralRiftHonors,
    };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.astralRiftEchoes).toBe(33);
    expect(next.purchasedAstralRiftRelics).toEqual(['vanguard_seed']);
    expect(next.astralRiftRecords).toEqual(state.astralRiftRecords);
    expect(next.claimedAstralRiftHonors).toEqual(['first_rift_clear']);
  });
});
