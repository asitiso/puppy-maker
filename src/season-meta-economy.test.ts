import { describe, expect, it } from 'vitest';

import { astralRiftDefinitions, nextAstralRiftUnlock } from './astral-rift';
import { celestialAscensionProgress, newlyEarnedAscensionRewards } from './celestial-ascension';
import { newlyEarnedCelestialHonors } from './celestial-records';
import { astralBlessings } from './sanctuary-astral-blessings';
import { resolveAstralTrial, type AstralTrialId } from './sanctuary-astral-trials';
import { seasonJourneyTiers } from './season-journey';
import { seasonShopOffers } from './season-shop';
import { sanctuaryFacilities } from './starlight-sanctuary';
import { weeklyDirectives } from './weekly-directives';

const materials = ['star_bark','arcane_shard','wind_pearl'] as const;

describe('season meta economy chain', () => {
  it('keeps Weekly Directive tokens meaningful while a full season can still clear the shop', () => {
    const journeyOnlyTokens = seasonJourneyTiers.reduce((sum,tier) => sum + tier.reward.tokens,0);
    const weeklyTokens = [3,4,5].flatMap(month => [1,2,3,4].map(week => weeklyDirectives(1,month,week)))
      .flat()
      .reduce((sum,directive) => sum + directive.reward.tokens,0);
    const fullShopCost = seasonShopOffers('1-spring').reduce((sum,offer) => sum + offer.cost * offer.limit,0);

    expect(fullShopCost).toBeGreaterThan(journeyOnlyTokens);
    expect(fullShopCost).toBeLessThanOrEqual(journeyOnlyTokens + weeklyTokens);
  });

  it('makes one sanctuary material cache enough to start any level-1 sanctuary facility without replacing the full sanctuary grind', () => {
    const cache = seasonShopOffers('1-spring').find(offer => offer.id === 'expedition_cache');
    expect(cache).toBeDefined();

    for (const facility of sanctuaryFacilities) {
      const levelOne = facility.upgrades.find(step => step.level === 1)!;
      for (const material of materials) {
        expect(cache!.reward.materials[material] ?? 0).toBeGreaterThanOrEqual(levelOne.cost.materials[material]);
      }
    }

    const totalCosts = Object.fromEntries(materials.map(material => [material,
      sanctuaryFacilities.reduce((facilitySum,facility) => facilitySum + facility.upgrades.reduce((stepSum,step) => stepSum + step.cost.materials[material],0),0),
    ])) as Record<(typeof materials)[number],number>;
    for (const material of materials) {
      expect((cache!.reward.materials[material] ?? 0) * cache!.limit).toBeLessThan(totalCosts[material]);
    }
  });

  it('turns the first legal Astral clear into a real bridge toward blessing and Rift progression', () => {
    const clear = resolveAstralTrial({
      year:1,
      month:1,
      power:0,
      constellations:['dawn_star','scholar_star'],
      claimedKeys:[],
    });
    expect(clear.accepted).toBe(true);
    if (!clear.accepted) return;

    const records = [{ key:clear.key, grade:clear.grade, power:0 }];
    const ascension = celestialAscensionProgress({
      trialRecords:records,
      blessingCount:0,
      constellationCount:2,
      sanctuaryGrandProgress:35,
    });
    const firstRiftThreshold = Math.min(...astralRiftDefinitions.map(rift => rift.ascensionThreshold));
    expect(ascension).toBeGreaterThanOrEqual(firstRiftThreshold);
    expect(nextAstralRiftUnlock(ascension)?.threshold ?? firstRiftThreshold).toBeGreaterThanOrEqual(firstRiftThreshold);

    const honorShards = newlyEarnedCelestialHonors(records,[])
      .reduce((sum,honor) => sum + honor.reward.starShards,0);
    const rankShards = newlyEarnedAscensionRewards(ascension,[])
      .reduce((sum,rank) => sum + rank.reward.starShards,0);
    const scholarBlessing = astralBlessings.find(blessing => blessing.requiredTrial === 'scholar_trial')!;
    expect(clear.starShards + honorShards + rankShards).toBeGreaterThanOrEqual(scholarBlessing.cost);
  });

  it('keeps the final Rift threshold reachable through legitimate monthly Astral records', () => {
    const trials:AstralTrialId[] = ['scholar_trial','wayfarer_trial','guardian_trial','crown_trial'];
    const records = Array.from({ length:12 },(_,index) => ({
      key:`1-${index + 1}:${trials[index % trials.length]}`,
      grade:'S' as const,
      power:120,
    }));
    const ascension = celestialAscensionProgress({
      trialRecords:records,
      blessingCount:4,
      constellationCount:5,
      sanctuaryGrandProgress:65,
    });
    const finalThreshold = Math.max(...astralRiftDefinitions.map(rift => rift.ascensionThreshold));

    expect(ascension).toBeGreaterThanOrEqual(finalThreshold);
    expect(nextAstralRiftUnlock(ascension)).toBeNull();
  });

  it('never reissues permanent Celestial rewards after their claim ids are recorded', () => {
    const trials:AstralTrialId[] = ['scholar_trial','wayfarer_trial','guardian_trial','crown_trial'];
    const records = Array.from({ length:12 },(_,index) => ({
      key:`1-${index + 1}:${trials[index % trials.length]}`,
      grade:'S' as const,
      power:120,
    }));
    const claimedHonors = ['first_light','full_cycle','perfect_cycle','twelve_trials'] as const;
    const claimedRanks = ['awakened','stellar','empyrean','transcendent'] as const;

    expect(newlyEarnedCelestialHonors(records,claimedHonors)).toEqual([]);
    expect(newlyEarnedAscensionRewards(83,claimedRanks)).toEqual([]);
  });
});
