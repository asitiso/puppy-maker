import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('sanctuary grand milestone progression', () => {
  it('hydrates only valid unique claimed grand ranks', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedSanctuaryGrandRanks:['haven','bad','haven','celestial'],
    });
    expect(hydrated.claimedSanctuaryGrandRanks).toEqual(['haven','celestial']);
  });

  it('grants a newly crossed grand rank reward together with a masterwork exactly once', () => {
    const ready = {
      ...initialState,
      gold:5000,
      gems:0,
      expeditionMaterials:{ star_bark:20, arcane_shard:20, wind_pearl:20 },
      sanctuaryLevels:{ training_hall:3 as const, archive_library:0 as const, herb_garden:0 as const, observatory:0 as const },
      sanctuarySpecializations:{ training_hall:'warrior_doctrine' as const },
    };
    const next = reducer(ready,{ type:'BUILD_SANCTUARY_MASTERWORK', masterwork:'guardian_arena' });
    expect(next.claimedSanctuaryGrandRanks).toEqual(['haven']);
    expect(next.gold).toBe(2900);
    expect(next.gems).toBe(1);
    expect(reducer(next,{ type:'BUILD_SANCTUARY_MASTERWORK', masterwork:'guardian_arena' })).toBe(next);
  });
});
