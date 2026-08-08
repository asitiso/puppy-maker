import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('starlight sanctuary progression', () => {
  it('hydrates old and malformed saves safely', () => {
    expect(hydrateGameState({ ...initialState, sanctuaryLevels:undefined }).sanctuaryLevels).toEqual({ training_hall:0, archive_library:0, herb_garden:0, observatory:0 });
    expect(hydrateGameState({ ...initialState, sanctuaryLevels:{ training_hall:9, archive_library:-1, herb_garden:2.9, observatory:'3' } }).sanctuaryLevels).toEqual({ training_hall:3, archive_library:0, herb_garden:2, observatory:0 });
  });

  it('spends exact resources for a valid training hall upgrade', () => {
    const ready = {
      ...initialState,
      gold:700,
      expeditionMaterials:{ ...initialState.expeditionMaterials, star_bark:4 },
    };
    const next = reducer(ready,{ type:'UPGRADE_SANCTUARY', facility:'training_hall' });
    expect(next.sanctuaryLevels.training_hall).toBe(1);
    expect(next.gold).toBe(200);
    expect(next.expeditionMaterials.star_bark).toBe(1);
  });

  it('returns the same object when resources are insufficient', () => {
    const next = reducer(initialState,{ type:'UPGRADE_SANCTUARY', facility:'training_hall' });
    expect(next).toBe(initialState);
  });

  it('enforces level-three renown without consuming renown', () => {
    const ready = {
      ...initialState,
      gold:2000,
      sanctuaryLevels:{ training_hall:2 as const, archive_library:0 as const, herb_garden:0 as const, observatory:0 as const },
      expeditionMaterials:{ ...initialState.expeditionMaterials, star_bark:10, arcane_shard:5, wind_pearl:5 },
      regionalRenown:{ ...initialState.regionalRenown, starlight_forest:2 },
    };
    expect(reducer(ready,{ type:'UPGRADE_SANCTUARY', facility:'training_hall' })).toBe(ready);
    const eligible = { ...ready, regionalRenown:{ ...ready.regionalRenown, starlight_forest:3 } };
    const next = reducer(eligible,{ type:'UPGRADE_SANCTUARY', facility:'training_hall' });
    expect(next.sanctuaryLevels.training_hall).toBe(3);
    expect(next.regionalRenown.starlight_forest).toBe(3);
  });

  it('returns the same object for a max-level facility', () => {
    const ready = { ...initialState, sanctuaryLevels:{ training_hall:3 as const, archive_library:0 as const, herb_garden:0 as const, observatory:0 as const } };
    expect(reducer(ready,{ type:'UPGRADE_SANCTUARY', facility:'training_hall' })).toBe(ready);
  });
});
