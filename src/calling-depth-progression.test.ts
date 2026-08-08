import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('Calling depth reducer progression', () => {
  it('awards specialist Calling mastery only when its expedition action was used on a clear', () => {
    const vanguard = {
      ...initialState,
      activeCalling:'vanguard' as const,
      callingMastery:{ ...initialState.callingMastery, vanguard:2 },
    };
    const trained = reducer(vanguard, {
      type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700,
      actionKinds:{ attack:2, dodge:0, charge:0 },
    });
    expect(trained.callingMastery.vanguard).toBe(3);

    const noSpecialist = reducer(vanguard, {
      type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700,
      actionKinds:{ attack:0, dodge:2, charge:0 },
    });
    expect(noSpecialist.callingMastery.vanguard).toBe(2);
  });

  it('lets Pathfinder eye reach a discovery tier earlier without increasing stored outing XP', () => {
    const state = {
      ...initialState,
      activeCalling:'pathfinder' as const,
      purchasedTraits:['pathfinder_herb','pathfinder_eye'] as typeof initialState.purchasedTraits,
      explorationXp:{ ...initialState.explorationXp, forest:0 },
    };
    const next = reducer(state, { type:'GO_OUTING', location:'forest', eventRoll:0.5 });
    expect(next.explorationXp.forest).toBe(1);
    expect(next.discoveries).toContain('moon_feather');
  });

  it('grants Pathfinder Legend gold only for the first new outing discovery of the month', () => {
    const state = {
      ...initialState,
      activeCalling:'pathfinder' as const,
      purchasedTraits:['pathfinder_herb','pathfinder_eye','pathfinder_supply','pathfinder_legend'] as typeof initialState.purchasedTraits,
      explorationXp:{ forest:3, village:3, lakeside:3 },
    };
    const first = reducer(state, { type:'GO_OUTING', location:'forest', eventRoll:0.5 });
    expect(first.gold).toBe(state.gold + 100);
    expect(first.legendRewardKeys).toContain('1-4:pathfinder_legend');
    const second = reducer(first, { type:'GO_OUTING', location:'village', eventRoll:0.5 });
    expect(second.gold).toBe(first.gold);
    expect(second.legendRewardKeys.filter(key => key === '1-4:pathfinder_legend')).toHaveLength(1);
  });

  it('applies Vanguard Legend fatigue protection once per month', () => {
    const state = {
      ...initialState,
      activeCalling:'vanguard' as const,
      purchasedTraits:['vanguard_power','vanguard_focus','vanguard_assault','vanguard_legend'] as typeof initialState.purchasedTraits,
    };
    const first = reducer(state, {
      type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700, fatigueDelta:8, stressDelta:0,
      actionKinds:{ attack:1, dodge:0, charge:0 },
    });
    expect(first.stats.fatigue).toBe(initialState.stats.fatigue + 6);
    expect(first.legendRewardKeys).toContain('1-4:vanguard_legend');
  });

  it('applies Caretaker Legend when a new bond scene opens', () => {
    const state = {
      ...initialState,
      activeCalling:'caretaker' as const,
      purchasedTraits:['caretaker_rest','caretaker_bond','caretaker_guard','caretaker_legend'] as typeof initialState.purchasedTraits,
    };
    const next = reducer(state, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });
    expect(next.unlockedBondScenes).toContain('favorite_place');
    expect(next.stats.stress).toBe(initialState.stats.stress - 4);
  });

  it('hydrates legacy saves with safe empty Legend dedupe state', () => {
    const hydrated = hydrateGameState({ ...initialState, legendRewardKeys:undefined });
    expect(hydrated.legendRewardKeys).toEqual([]);
    const sanitized = hydrateGameState({ ...initialState, legendRewardKeys:['1-4:vanguard_legend','bad','1-4:vanguard_legend'] });
    expect(sanitized.legendRewardKeys).toEqual(['1-4:vanguard_legend']);
  });
});
