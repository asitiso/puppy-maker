import { describe, expect, it } from 'vitest';
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
});
