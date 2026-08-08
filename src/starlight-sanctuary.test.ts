import { describe, expect, it } from 'vitest';
import {
  emptySanctuaryLevels,
  resolveSanctuaryUpgrade,
  sanitizeSanctuaryLevels,
  sanctuaryEffects,
} from './starlight-sanctuary';

const rich = {
  gold:99999,
  materials:{ star_bark:99, arcane_shard:99, wind_pearl:99 },
  renown:{ starlight_forest:9, ancient_city:9, wind_lakes:9 },
};

describe('starlight sanctuary', () => {
  it('starts empty and sanitizes malformed levels safely', () => {
    expect(emptySanctuaryLevels()).toEqual({ training_hall:0, archive_library:0, herb_garden:0, observatory:0 });
    expect(sanitizeSanctuaryLevels({ training_hall:9, archive_library:-2, herb_garden:2.8, observatory:'3' })).toEqual({ training_hall:3, archive_library:0, herb_garden:2, observatory:0 });
  });

  it('quotes and accepts the exact first training hall upgrade', () => {
    const result = resolveSanctuaryUpgrade({
      facility:'training_hall', levels:emptySanctuaryLevels(),
      gold:500, materials:{ star_bark:3, arcane_shard:0, wind_pearl:0 },
      renown:{ starlight_forest:0, ancient_city:0, wind_lakes:0 },
    });
    expect(result).toEqual(expect.objectContaining({ accepted:true, nextLevel:1, cost:{ gold:500, materials:{ star_bark:3, arcane_shard:0, wind_pearl:0 } } }));
  });

  it('rejects unaffordable and max-level upgrades', () => {
    expect(resolveSanctuaryUpgrade({ facility:'training_hall', levels:emptySanctuaryLevels(), gold:499, materials:{ star_bark:3, arcane_shard:0, wind_pearl:0 }, renown:rich.renown }).accepted).toBe(false);
    expect(resolveSanctuaryUpgrade({ facility:'training_hall', levels:{ ...emptySanctuaryLevels(), training_hall:3 }, ...rich }).accepted).toBe(false);
  });

  it('requires regional renown only for level three', () => {
    const levels = { ...emptySanctuaryLevels(), training_hall:2 as const };
    const blocked = resolveSanctuaryUpgrade({ facility:'training_hall', levels, gold:1600, materials:{ star_bark:7, arcane_shard:3, wind_pearl:3 }, renown:{ starlight_forest:2, ancient_city:9, wind_lakes:9 } });
    expect(blocked).toEqual(expect.objectContaining({ accepted:false, reason:'renown' }));
    const ready = resolveSanctuaryUpgrade({ facility:'training_hall', levels, gold:1600, materials:{ star_bark:7, arcane_shard:3, wind_pearl:3 }, renown:{ starlight_forest:3, ancient_city:0, wind_lakes:0 } });
    expect(ready.accepted).toBe(true);
  });

  it('derives capped effects from facility levels', () => {
    expect(sanctuaryEffects({ training_hall:3, archive_library:3, herb_garden:3, observatory:3 })).toEqual({
      trainingPercent:3,
      masteryStrongMonth:1,
      masteryAllMonth:1,
      fatigueRecovery:2,
      stressRecovery:1,
      expeditionJourneyBonus:3,
    });
  });
});
