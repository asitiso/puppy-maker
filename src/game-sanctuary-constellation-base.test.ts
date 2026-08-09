import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game-sanctuary-constellation-base';

describe('sanctuary constellation game integration', () => {
  it('hydrates constellation unlocks defensively', () => {
    expect(hydrateGameState({ sanctuaryConstellations:['dawn_compass','bad','dawn_compass'] }).sanctuaryConstellations).toEqual(['dawn_compass']);
  });

  it('unlocks eligible nodes for free once sanctuary progress is sufficient', () => {
    const state = {
      ...initialState,
      sanctuaryLevels:{ training_hall:3, archive_library:3, herb_garden:3, observatory:3 } as const,
      sanctuarySpecializations:{
        training_hall:'warrior_doctrine',
        archive_library:'mastery_codex',
        herb_garden:'moonwell_garden',
        observatory:'expedition_array',
      } as typeof initialState.sanctuarySpecializations,
      sanctuaryMasterworks:['champion_court','living_archive','moonwell_garden','astral_beacon'],
      sanctuaryPrestige:180,
    } as typeof initialState;
    const next = reducer(state,{ type:'UNLOCK_SANCTUARY_CONSTELLATION', constellation:'dawn_compass' });
    expect(next.sanctuaryConstellations).toEqual(['dawn_compass']);
    expect(next.gold).toBe(state.gold);
  });

  it('does not unlock an ineligible node', () => {
    expect(reducer(initialState,{ type:'UNLOCK_SANCTUARY_CONSTELLATION', constellation:'celestial_crown' })).toBe(initialState);
  });
});
