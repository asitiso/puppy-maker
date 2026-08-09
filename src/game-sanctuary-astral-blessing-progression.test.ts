import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game-sanctuary-astral-base';

describe('astral blessing game progression', () => {
  it('hydrates only valid permanent blessings', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      purchasedAstralBlessings:['scholar_glow','bad','scholar_glow','guardian_aegis'],
    });
    expect(hydrated.purchasedAstralBlessings).toEqual(['scholar_glow','guardian_aegis']);
  });

  it('spends star shards once after the matching trial was cleared', () => {
    const state = {
      ...initialState,
      astralStarShards:3,
      claimedAstralTrials:['1-1:scholar_trial'],
    };
    const next = reducer(state,{ type:'PURCHASE_ASTRAL_BLESSING', blessing:'scholar_glow' });
    expect(next.astralStarShards).toBe(0);
    expect(next.purchasedAstralBlessings).toEqual(['scholar_glow']);
    expect(reducer(next,{ type:'PURCHASE_ASTRAL_BLESSING', blessing:'scholar_glow' })).toBe(next);
  });

  it('applies scholar blessing to positive training growth', () => {
    const state = { ...initialState, purchasedAstralBlessings:['scholar_glow'] as typeof initialState.purchasedAstralBlessings };
    const next = reducer(state,{ type:'FINISH_TRAINING', eventRoll:0.99 });
    expect(next.stats.strength).toBeGreaterThanOrEqual(initialState.stats.strength);
  });
});
