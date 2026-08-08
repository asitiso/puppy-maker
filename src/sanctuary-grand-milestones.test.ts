import { describe, expect, it } from 'vitest';
import { sanctuaryGrandProgress, sanctuaryGrandRank, newlyEarnedSanctuaryGrandRewards } from './sanctuary-grand-milestones';

describe('sanctuary grand milestones', () => {
  it('combines all sanctuary meta progress into one bounded score', () => {
    expect(sanctuaryGrandProgress({ levels:{ training_hall:3, archive_library:3, herb_garden:3, observatory:3 }, specializationCount:4, masterworkCount:4, prestige:180 })).toBe(65);
  });
  it('maps progress to five long-term ranks', () => {
    expect(sanctuaryGrandRank(0).id).toBe('seed');
    expect(sanctuaryGrandRank(12).id).toBe('haven');
    expect(sanctuaryGrandRank(25).id).toBe('sanctum');
    expect(sanctuaryGrandRank(42).id).toBe('citadel');
    expect(sanctuaryGrandRank(65)).toEqual(expect.objectContaining({ id:'celestial', nextThreshold:null }));
  });
  it('returns newly crossed rewards only', () => {
    const earned = newlyEarnedSanctuaryGrandRewards(45,['haven']);
    expect(earned.map(item => item.rank)).toEqual(['sanctum','citadel']);
    expect(earned.reduce((sum,item) => sum + item.reward.gems,0)).toBe(3);
  });
});
