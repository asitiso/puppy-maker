import { describe, expect, it } from 'vitest';
import { bondSceneDefinitions, eligibleBondScenes, type BondSceneId } from './bond-scenes';

describe('Runa bond scenes', () => {
  it('defines ten scenes in relationship progression order', () => {
    expect(bondSceneDefinitions.map(item => item.id)).toEqual([
      'first_trust','favorite_place','shared_secret','training_promise','gift_memory',
      'guardian_confession','first_boss_together','three_regions_together','year_together','precious_partner',
    ]);
  });

  it('unlocks early relationship scenes from affection and shared activities', () => {
    expect(eligibleBondScenes({ affection:54, outings:0, trainings:0, gifts:0, guardianRank:'trainee', bossClears:0, annualRecords:0, alreadyUnlocked:[] })).toEqual([]);
    expect(eligibleBondScenes({ affection:76, outings:1, trainings:10, gifts:0, guardianRank:'trainee', bossClears:0, annualRecords:0, alreadyUnlocked:[] })).toEqual(['first_trust','favorite_place','shared_secret','training_promise']);
  });

  it('keeps every relationship threshold exact', () => {
    const base = { affection:0, outings:0, trainings:0, gifts:0, guardianRank:'trainee' as const, bossClears:0, annualRecords:0, alreadyUnlocked:[] as BondSceneId[] };

    expect(eligibleBondScenes({ ...base, affection:54 })).not.toContain('first_trust');
    expect(eligibleBondScenes({ ...base, affection:55 })).toContain('first_trust');

    expect(eligibleBondScenes({ ...base, affection:65, outings:0 })).not.toContain('favorite_place');
    expect(eligibleBondScenes({ ...base, affection:65, outings:1 })).toContain('favorite_place');

    expect(eligibleBondScenes({ ...base, affection:74 })).not.toContain('shared_secret');
    expect(eligibleBondScenes({ ...base, affection:75 })).toContain('shared_secret');
    expect(eligibleBondScenes({ ...base, affection:75, trainings:9 })).not.toContain('training_promise');
    expect(eligibleBondScenes({ ...base, affection:75, trainings:10 })).toContain('training_promise');

    expect(eligibleBondScenes({ ...base, affection:79, gifts:5 })).not.toContain('gift_memory');
    expect(eligibleBondScenes({ ...base, affection:80, gifts:4 })).not.toContain('gift_memory');
    expect(eligibleBondScenes({ ...base, affection:80, gifts:5 })).toContain('gift_memory');

    expect(eligibleBondScenes({ ...base, affection:84, guardianRank:'guardian' })).not.toContain('guardian_confession');
    expect(eligibleBondScenes({ ...base, affection:85, guardianRank:'junior' })).not.toContain('guardian_confession');
    expect(eligibleBondScenes({ ...base, affection:85, guardianRank:'guardian' })).toContain('guardian_confession');

    expect(eligibleBondScenes({ ...base, bossClears:0 })).not.toContain('first_boss_together');
    expect(eligibleBondScenes({ ...base, bossClears:1 })).toContain('first_boss_together');
    expect(eligibleBondScenes({ ...base, bossClears:2 })).not.toContain('three_regions_together');
    expect(eligibleBondScenes({ ...base, bossClears:3 })).toContain('three_regions_together');

    expect(eligibleBondScenes({ ...base, annualRecords:0 })).not.toContain('year_together');
    expect(eligibleBondScenes({ ...base, annualRecords:1 })).toContain('year_together');
  });

  it('treats malformed numeric progress as zero instead of unlocking scenes', () => {
    expect(eligibleBondScenes({
      affection:Number.POSITIVE_INFINITY,
      outings:Number.POSITIVE_INFINITY,
      trainings:Number.POSITIVE_INFINITY,
      gifts:Number.POSITIVE_INFINITY,
      guardianRank:'guardian',
      bossClears:Number.POSITIVE_INFINITY,
      annualRecords:Number.POSITIVE_INFINITY,
      alreadyUnlocked:[],
    })).toEqual([]);

    expect(eligibleBondScenes({
      affection:Number.NaN,
      outings:Number.NaN,
      trainings:Number.NaN,
      gifts:Number.NaN,
      guardianRank:'guardian',
      bossClears:Number.NaN,
      annualRecords:Number.NaN,
      alreadyUnlocked:[],
    })).toEqual([]);
  });

  it('unlocks expedition and annual relationship scenes from persistent progress', () => {
    const result = eligibleBondScenes({ affection:90, outings:3, trainings:20, gifts:5, guardianRank:'guardian', bossClears:3, annualRecords:1, alreadyUnlocked:[] });
    expect(result).toEqual([
      'first_trust','favorite_place','shared_secret','training_promise','gift_memory','guardian_confession',
      'first_boss_together','three_regions_together','year_together',
    ]);
  });

  it('requires affection 95 and eight prior scenes for precious partner', () => {
    const prior = ['first_trust','favorite_place','shared_secret','training_promise','gift_memory','guardian_confession','first_boss_together','three_regions_together'] as const;
    expect(eligibleBondScenes({ affection:94, outings:3, trainings:20, gifts:5, guardianRank:'guardian', bossClears:3, annualRecords:1, alreadyUnlocked:[...prior] })).not.toContain('precious_partner');
    expect(eligibleBondScenes({ affection:95, outings:3, trainings:20, gifts:5, guardianRank:'guardian', bossClears:3, annualRecords:1, alreadyUnlocked:[...prior] })).toContain('precious_partner');
  });

  it('counts only valid earlier bond scenes toward precious partner', () => {
    const sevenPrior: BondSceneId[] = [
      'first_trust','favorite_place','shared_secret','training_promise','gift_memory','guardian_confession','first_boss_together',
    ];
    const pollutedPrior = [...sevenPrior, 'precious_partner', 'unknown_scene' as BondSceneId];
    const progress = {
      affection:95,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
    };

    expect(eligibleBondScenes({ ...progress, alreadyUnlocked:pollutedPrior })).not.toContain('precious_partner');
    expect(eligibleBondScenes({ ...progress, alreadyUnlocked:[...sevenPrior, 'three_regions_together'] })).toContain('precious_partner');
  });
});
