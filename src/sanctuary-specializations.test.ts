import { describe, expect, it } from 'vitest';
import {
  resolveSanctuarySpecialization,
  sanctuarySpecializationEffects,
  sanctuarySpecializationGameplayEffects,
  sanctuarySpecializationSynergies,
  sanctuarySpecializations,
} from './sanctuary-specializations';
import { emptySanctuaryLevels } from './starlight-sanctuary';

describe('sanctuary specializations', () => {
  it('defines two permanent options for each sanctuary facility', () => {
    expect(sanctuarySpecializations).toHaveLength(8);
    for (const facility of ['training_hall','archive_library','herb_garden','observatory'] as const) {
      expect(sanctuarySpecializations.filter(item => item.facility === facility)).toHaveLength(2);
    }
  });

  it('requires facility level 3 and rejects a conflicting choice in the same facility', () => {
    const locked = resolveSanctuarySpecialization({
      specialization:'warrior_doctrine',
      levels:emptySanctuaryLevels(),
      selected:{},
    });
    expect(locked.accepted).toBe(false);
    expect(locked.reason).toBe('level');

    const levels = { ...emptySanctuaryLevels(), training_hall:3 as const };
    const first = resolveSanctuarySpecialization({ specialization:'warrior_doctrine', levels, selected:{} });
    expect(first).toEqual(expect.objectContaining({ accepted:true, selected:{ training_hall:'warrior_doctrine' } }));

    const conflict = resolveSanctuarySpecialization({
      specialization:'adaptive_drills',
      levels,
      selected:first.selected,
    });
    expect(conflict.accepted).toBe(false);
    expect(conflict.reason).toBe('chosen');
  });

  it('ignores valid specialization ids stored under the wrong facility slot', () => {
    const malformed = {
      training_hall:'moonwell_garden',
      archive_library:'season_lens',
      herb_garden:'warrior_doctrine',
      observatory:'mastery_codex',
    } as never;
    expect(sanctuarySpecializationEffects(malformed)).toEqual({
      trainingPercent:0,
      masteryXp:0,
      monthlyJourneyBonus:0,
      fatigueRecovery:0,
      stressRecovery:0,
      bondAffectionBonus:0,
      expeditionJourneyBonus:0,
      weeklyTokenBonus:0,
    });
    expect(sanctuarySpecializationSynergies(malformed)).toEqual([]);
  });

  it('derives focused additive effects from selected specializations', () => {
    const effects = sanctuarySpecializationEffects({
      training_hall:'warrior_doctrine',
      archive_library:'mastery_codex',
      herb_garden:'moonwell_garden',
      observatory:'expedition_array',
    });
    expect(effects).toEqual(expect.objectContaining({
      trainingPercent:2,
      masteryXp:1,
      fatigueRecovery:1,
      stressRecovery:1,
      expeditionJourneyBonus:2,
    }));
  });

  it('activates the four intended cross-facility synergies', () => {
    expect(sanctuarySpecializationSynergies({
      training_hall:'warrior_doctrine',
      archive_library:'mastery_codex',
      herb_garden:'bonding_grove',
      observatory:'season_lens',
    })).toEqual(expect.arrayContaining(['guardian_academy']));

    expect(sanctuarySpecializationSynergies({
      training_hall:'adaptive_drills',
      archive_library:'living_chronicle',
      herb_garden:'moonwell_garden',
      observatory:'season_lens',
    })).toEqual(expect.arrayContaining(['season_oracle']));
  });

  it('converts active synergies into bounded extra gameplay bonuses', () => {
    expect(sanctuarySpecializationGameplayEffects({
      training_hall:'warrior_doctrine',
      archive_library:'mastery_codex',
    })).toEqual(expect.objectContaining({ trainingPercent:3, masteryXp:1 }));

    expect(sanctuarySpecializationGameplayEffects({
      training_hall:'adaptive_drills',
      observatory:'expedition_array',
    })).toEqual(expect.objectContaining({ expeditionJourneyBonus:3 }));

    expect(sanctuarySpecializationGameplayEffects({
      herb_garden:'bonding_grove',
      archive_library:'living_chronicle',
    })).toEqual(expect.objectContaining({ bondAffectionBonus:2, monthlyJourneyBonus:5 }));

    expect(sanctuarySpecializationGameplayEffects({
      herb_garden:'moonwell_garden',
      observatory:'season_lens',
    })).toEqual(expect.objectContaining({ weeklyTokenBonus:2, fatigueRecovery:1, stressRecovery:1 }));
  });
});
