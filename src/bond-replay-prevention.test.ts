import { describe, expect, it } from 'vitest';
import { reconcileBondSceneRewards } from './raising-depth-rewards';

const base = {
  affection:0,
  outings:0,
  trainings:0,
  gifts:0,
  guardianRank:'trainee' as const,
  bossClears:0,
  annualRecords:0,
  gold:500,
  gems:2,
};

describe('bond scene replay prevention', () => {
  it('repairs a reward-proven historical scene without announcing it as newly unlocked', () => {
    const progress = {
      ...base,
      unlocked:[],
      rewarded:['first_trust' as const],
    };

    const repaired = reconcileBondSceneRewards(progress, progress);

    expect(repaired.changed).toBe(true);
    expect(repaired.unlocked).toEqual(['first_trust']);
    expect(repaired.rewarded).toEqual(['first_trust']);
    expect(repaired.newlyUnlocked).toEqual([]);
    expect(repaired.gold).toBe(500);
    expect(repaired.gems).toBe(2);
  });

  it('still announces a genuinely new eligible scene exactly once', () => {
    const progress = {
      ...base,
      affection:55,
      unlocked:[],
      rewarded:[],
    };

    const first = reconcileBondSceneRewards(progress, progress);
    expect(first.newlyUnlocked).toEqual(['first_trust']);
    expect(first.gold).toBe(600);

    const stable = {
      ...progress,
      unlocked:first.unlocked,
      rewarded:first.rewarded,
      gold:first.gold,
      gems:first.gems,
    };
    const second = reconcileBondSceneRewards(stable, stable);
    expect(second.changed).toBe(false);
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.gold).toBe(600);
  });
});
