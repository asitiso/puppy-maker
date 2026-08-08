import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('raising depth persistent progression', () => {
  it('hydrates legacy saves with safe raising identity defaults', () => {
    const state = hydrateGameState({ year:2, month:5, gold:1234 });
    expect(state.activeCalling).toBeNull();
    expect(state.callingHistory).toEqual([]);
    expect(state.callingMastery).toEqual({ vanguard:0, arcanist:0, caretaker:0, pathfinder:0 });
    expect(state.callingLastSwitchKey).toBeNull();
    expect(state.growthPoints).toBe(0);
    expect(state.purchasedTraits).toEqual([]);
    expect(state.unlockedBondScenes).toEqual([]);
    expect(state.rewardedBondScenes).toEqual([]);
    expect(state.growthPointBossRewards).toEqual([]);
  });

  it('sanitizes malformed calling, points, mastery, traits, and scene data', () => {
    const state = hydrateGameState({
      ...initialState,
      activeCalling:'bad', callingHistory:['vanguard','bad','vanguard'],
      callingMastery:{ vanguard:3.8, arcanist:-5, caretaker:2, pathfinder:99 },
      callingLastSwitchKey:'not-a-month', growthPoints:-8,
      purchasedTraits:['vanguard_power','bad','vanguard_power'],
      unlockedBondScenes:['first_trust','bad'], rewardedBondScenes:['first_trust','bad'],
      growthPointBossRewards:['forest_guardian','forest_path','bad'],
    });
    expect(state.activeCalling).toBeNull();
    expect(state.callingHistory).toEqual(['vanguard']);
    expect(state.callingMastery).toEqual({ vanguard:3, arcanist:0, caretaker:2, pathfinder:99 });
    expect(state.callingLastSwitchKey).toBeNull();
    expect(state.growthPoints).toBe(0);
    expect(state.purchasedTraits).toEqual(['vanguard_power']);
    expect(state.unlockedBondScenes).toEqual(['first_trust']);
    expect(state.rewardedBondScenes).toEqual(['first_trust']);
    expect(state.growthPointBossRewards).toEqual(['forest_guardian']);
  });

  it('selects a calling through the reducer and spends points on valid traits', () => {
    const ready = { ...initialState, rewardedGuardianRanks:['guardian'], gold:1000, growthPoints:3 } as any;
    const selected = reducer(ready, { type:'SET_GUARDIAN_CALLING', calling:'vanguard' } as any);
    expect(selected.activeCalling).toBe('vanguard');
    expect(selected.callingHistory).toEqual(['vanguard']);
    const trait = reducer(selected, { type:'PURCHASE_GROWTH_TRAIT', trait:'vanguard_power' } as any);
    expect(trait.purchasedTraits).toEqual(['vanguard_power']);
    expect(trait.growthPoints).toBe(2);
  });

  it('preserves raising identity progression across NEXT_MONTH and resets it on RESET', () => {
    const progressed = {
      ...initialState,
      activeCalling:'arcanist', callingHistory:['vanguard','arcanist'], callingMastery:{ vanguard:4, arcanist:6, caretaker:0, pathfinder:0 },
      callingLastSwitchKey:'1-4', growthPoints:5, purchasedTraits:['arcanist_mana'],
      unlockedBondScenes:['first_trust'], rewardedBondScenes:['first_trust'], growthPointBossRewards:['forest_guardian'],
    } as any;
    const next = reducer(progressed, { type:'NEXT_MONTH' });
    expect(next.activeCalling).toBe('arcanist');
    expect(next.callingHistory).toEqual(['vanguard','arcanist']);
    expect(next.purchasedTraits).toEqual(['arcanist_mana']);
    const reset = reducer(progressed, { type:'RESET' });
    expect(reset.activeCalling).toBeNull();
    expect(reset.purchasedTraits).toEqual([]);
  });
});
