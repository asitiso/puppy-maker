import { describe, expect, it } from 'vitest';
import {
  resolveSanctuarySpecialization,
  sanctuarySpecializationEffects,
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
});
