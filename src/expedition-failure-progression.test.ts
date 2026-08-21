import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';
import { resolveExpeditionFinish } from './expedition-rewards';
import { emptyExpeditionPersistentState } from './expedition-state';

const rewardState = () => ({
  ...emptyExpeditionPersistentState(),
  gold: 1000,
  gems: 10,
  affection: 50,
  inventory: { star_cookie: 0, herb_tea: 0, fox_charm: 0 },
});

describe('failed expedition progression semantics', () => {
  it('keeps accepted separate from cleared and does not emit success rewards for a C attempt', () => {
    const before = rewardState();
    const resolved = resolveExpeditionFinish(before, 'forest_path', 100);

    expect(resolved.summary.accepted).toBe(true);
    expect(resolved.summary.cleared).toBe(false);
    expect(resolved.summary.firstClear).toBe(false);
    expect(resolved.summary.materialReward).toBe(0);
    expect(resolved.summary.discovery).toBeNull();
    expect(resolved.summary.storyUnlocked).toBe(false);
    expect(resolved.summary.bossBadge).toBe(false);
    expect(resolved.summary.regionCompleted).toBeNull();
    expect(resolved.summary.relicsUnlocked).toEqual([]);
    expect(resolved.summary.fullCompleted).toBe(false);
    expect(resolved.state.expeditionRecords.forest_path?.cleared).toBe(false);
    expect(resolved.state.rewardedExpeditionStages).toEqual(before.rewardedExpeditionStages);
    expect(resolved.state.expeditionStoryEntries).toEqual(before.expeditionStoryEntries);
    expect(resolved.state.expeditionDiscoveries).toEqual(before.expeditionDiscoveries);
    expect(resolved.state.expeditionMaterials).toEqual(before.expeditionMaterials);
    expect(resolved.state.gold).toBe(before.gold);
    expect(resolved.state.gems).toBe(before.gems);
  });

  it('does not record an accepted C attempt as successful world progression', () => {
    const next = reducer(initialState, {
      type: 'FINISH_EXPEDITION_STAGE',
      stageId: 'forest_path',
      score: 100,
      actionKinds: { attack: 1, dodge: 1, charge: 1 },
    });

    expect(next.expeditionRecords.forest_path?.bestGrade).toBe('C');
    expect(next.expeditionRecords.forest_path?.cleared).toBe(false);
    expect(next.regionalRenown).toEqual(initialState.regionalRenown);
    expect(next.expeditionSeasonScores).toEqual(initialState.expeditionSeasonScores);
    expect(next.worldContractProgress).toEqual(initialState.worldContractProgress);
    expect(next.rewardedWorldContracts).toEqual(initialState.rewardedWorldContracts);
    expect(next.lastWorldProgress).toBeNull();
  });
});
