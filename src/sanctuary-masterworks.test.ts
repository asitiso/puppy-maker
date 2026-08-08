import { describe, expect, it } from 'vitest';
import {
  canBuildSanctuaryMasterwork,
  sanctuaryMasterworkEffects,
  sanctuaryMasterworks,
  sanctuaryMasterworkSetReward,
} from './sanctuary-masterworks';
import { emptySanctuaryLevels } from './starlight-sanctuary';

describe('sanctuary masterworks', () => {
  const levels = { training_hall:3 as const, archive_library:3 as const, herb_garden:3 as const, observatory:3 as const };
  const specializations = {
    training_hall:'warrior_doctrine' as const,
    archive_library:'mastery_codex' as const,
    herb_garden:'moonwell_garden' as const,
    observatory:'expedition_array' as const,
  };
  const resources = { gold:10000, materials:{ star_bark:30, arcane_shard:30, wind_pearl:30 } };

  it('defines one final project for each level-three sanctuary facility', () => {
    expect(sanctuaryMasterworks).toHaveLength(4);
    expect(new Set(sanctuaryMasterworks.map(item => item.facility)).size).toBe(4);
    expect(sanctuaryMasterworks.every(item => item.cost.gold >= 2000)).toBe(true);
  });

  it('requires level three, an existing specialization, resources and no prior completion', () => {
    expect(canBuildSanctuaryMasterwork({ id:'guardian_arena', levels:emptySanctuaryLevels(), specializations:{}, completed:[], ...resources })).toEqual(expect.objectContaining({ accepted:false, reason:'level' }));
    expect(canBuildSanctuaryMasterwork({ id:'guardian_arena', levels, specializations:{}, completed:[], ...resources })).toEqual(expect.objectContaining({ accepted:false, reason:'specialization' }));
    expect(canBuildSanctuaryMasterwork({ id:'guardian_arena', levels, specializations, completed:[], gold:0, materials:resources.materials })).toEqual(expect.objectContaining({ accepted:false, reason:'resources' }));
    expect(canBuildSanctuaryMasterwork({ id:'guardian_arena', levels, specializations, completed:['guardian_arena'], ...resources })).toEqual(expect.objectContaining({ accepted:false, reason:'completed' }));
    expect(canBuildSanctuaryMasterwork({ id:'guardian_arena', levels, specializations, completed:[], ...resources })).toEqual(expect.objectContaining({ accepted:true }));
  });

  it('derives small additive permanent effects without replacing facility or specialization effects', () => {
    expect(sanctuaryMasterworkEffects(['guardian_arena','living_archive','moonwell_conservatory','astral_nexus'])).toEqual({
      trainingPercent:1,
      monthlyJourneyBonus:3,
      fatigueRecovery:1,
      stressRecovery:1,
      expeditionJourneyBonus:1,
      weeklyTokenBonus:1,
    });
  });

  it('unlocks a one-time grand completion reward only when all four projects exist', () => {
    expect(sanctuaryMasterworkSetReward(['guardian_arena','living_archive','moonwell_conservatory'])).toBeNull();
    expect(sanctuaryMasterworkSetReward(['guardian_arena','living_archive','moonwell_conservatory','astral_nexus'])).toEqual({ gold:1000, gems:5 });
  });
});
