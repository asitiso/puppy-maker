import { describe, expect, it } from 'vitest';
import { reconcileBondSceneRewards } from './raising-depth-rewards';
import { hydrateRaisingDepthState } from './raising-depth-state';

describe('raising depth state hydration', () => {
  it('preserves rewarded bond scenes even when the unlock list was lost', () => {
    const hydrated = hydrateRaisingDepthState({
      unlockedBondScenes: [],
      rewardedBondScenes: ['shared_secret'],
    });

    expect(hydrated.unlockedBondScenes).toEqual([]);
    expect(hydrated.rewardedBondScenes).toEqual(['shared_secret']);
  });

  it('restores a reward-only bond scene without paying it twice after hydration', () => {
    const hydrated = hydrateRaisingDepthState({
      unlockedBondScenes: [],
      rewardedBondScenes: ['first_trust'],
    });
    const progress = {
      affection:0,
      outings:0,
      trainings:0,
      gifts:0,
      guardianRank:'trainee' as const,
      bossClears:0,
      annualRecords:0,
      unlocked:hydrated.unlockedBondScenes,
      rewarded:hydrated.rewardedBondScenes,
      gold:500,
      gems:2,
    };

    const reconciled = reconcileBondSceneRewards(progress, progress);

    expect(reconciled.unlocked).toEqual(['first_trust']);
    expect(reconciled.rewarded).toEqual(['first_trust']);
    expect(reconciled.gold).toBe(500);
    expect(reconciled.gems).toBe(2);
    expect(reconciled.newlyUnlocked).toEqual([]);
  });

  it('canonicalizes persisted monthly Legend reward keys across zero-padded dates', () => {
    const hydrated = hydrateRaisingDepthState({
      legendRewardKeys:[
        '2-06:vanguard_legend',
        '2-6:vanguard_legend',
        '0-6:vanguard_legend',
        '2-13:vanguard_legend',
      ],
    });

    expect(hydrated.legendRewardKeys).toEqual(['2-6:vanguard_legend']);
  });
});
