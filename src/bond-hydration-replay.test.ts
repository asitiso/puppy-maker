import { describe, expect, it } from 'vitest';
import { hydrateRaisingDepthState } from './raising-depth-state';
import { reconcileBondSceneRewards } from './raising-depth-rewards';

describe('bond reward claim hydration', () => {
  it('preserves a rewarded scene as proof when the unlock marker is damaged', () => {
    const hydrated = hydrateRaisingDepthState({
      unlockedBondScenes: [],
      rewardedBondScenes: ['first_trust'],
    });

    expect(hydrated.unlockedBondScenes).toEqual(['first_trust']);
    expect(hydrated.rewardedBondScenes).toEqual(['first_trust']);
  });

  it('does not pay a preserved historical reward again after hydration', () => {
    const hydrated = hydrateRaisingDepthState({
      unlockedBondScenes: [],
      rewardedBondScenes: ['first_trust'],
    });
    const progress = {
      affection:55,
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
    expect(reconciled.changed).toBe(false);
    expect(reconciled.gold).toBe(500);
    expect(reconciled.gems).toBe(2);
  });
});
