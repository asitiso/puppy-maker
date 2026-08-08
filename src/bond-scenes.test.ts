import { describe, expect, it } from 'vitest';
import { bondSceneDefinitions, eligibleBondScenes } from './bond-scenes';

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
});
