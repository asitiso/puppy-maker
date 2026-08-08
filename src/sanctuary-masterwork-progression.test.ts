import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

const levelThree = {
  training_hall:3 as const,
  archive_library:3 as const,
  herb_garden:3 as const,
  observatory:3 as const,
};
const specializations = {
  training_hall:'warrior_doctrine' as const,
  archive_library:'mastery_codex' as const,
  herb_garden:'moonwell_garden' as const,
  observatory:'expedition_array' as const,
};
const materials = { star_bark:40, arcane_shard:40, wind_pearl:40 };

describe('sanctuary masterwork progression', () => {
  it('hydrates only valid unique completed masterworks', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      sanctuaryMasterworks:['guardian_arena','bad','guardian_arena','astral_nexus'],
    });
    expect(hydrated.sanctuaryMasterworks).toEqual(['guardian_arena','astral_nexus']);
  });

  it('builds a masterwork once, spends resources and grants its completion reward', () => {
    const ready = {
      ...initialState,
      gold:10000,
      expeditionMaterials:materials,
      sanctuaryLevels:levelThree,
      sanctuarySpecializations:specializations,
      claimedSanctuaryGrandRanks:['haven','sanctum'] as ('haven'|'sanctum')[],
    };
    const next = reducer(ready,{ type:'BUILD_SANCTUARY_MASTERWORK', masterwork:'guardian_arena' });
    expect(next.sanctuaryMasterworks).toEqual(['guardian_arena']);
    expect(next.gold).toBe(7600);
    expect(next.gems).toBe(ready.gems + 1);
    expect(next.expeditionMaterials).toEqual({ star_bark:30, arcane_shard:36, wind_pearl:36 });
    expect(reducer(next,{ type:'BUILD_SANCTUARY_MASTERWORK', masterwork:'guardian_arena' })).toBe(next);
  });

  it('awards the grand set bonus exactly when the fourth distinct masterwork is completed', () => {
    const ready = {
      ...initialState,
      gold:10000,
      gems:0,
      expeditionMaterials:materials,
      sanctuaryLevels:levelThree,
      sanctuarySpecializations:specializations,
      sanctuaryMasterworks:['guardian_arena','living_archive','moonwell_conservatory'] as const,
      claimedSanctuaryGrandRanks:['haven','sanctum','citadel'] as ('haven'|'sanctum'|'citadel')[],
    };
    const next = reducer(ready,{ type:'BUILD_SANCTUARY_MASTERWORK', masterwork:'astral_nexus' });
    expect(next.sanctuaryMasterworks).toHaveLength(4);
    expect(next.gold).toBe(8200);
    expect(next.gems).toBe(7);
  });

  it('applies a completed arena as a small permanent bonus on top of existing training systems', () => {
    const source = { ...initialState, sanctuaryLevels:levelThree, trainingScore:700 };
    const baseline = reducer(source,{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const boosted = reducer({ ...source, sanctuaryMasterworks:['guardian_arena'] as const },{ type:'FINISH_TRAINING', eventRoll:0.999 });
    const total = (state:typeof baseline) => state.stats.strength + state.stats.intelligence + state.stats.magic + state.stats.morality;
    expect(total(boosted)).toBeGreaterThan(total(baseline));
  });
});
