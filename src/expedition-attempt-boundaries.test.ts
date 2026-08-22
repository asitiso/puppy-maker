import { describe, expect, it } from 'vitest';
import { expeditionStageDefinitions } from './expedition-regions';
import { resolveExpeditionFinish } from './expedition-rewards';
import { emptyExpeditionPersistentState } from './expedition-state';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold: 1000,
  gems: 10,
  affection: 50,
  inventory: { star_cookie: 0, herb_tea: 0, fox_charm: 0 },
});

describe('expedition accepted / cleared boundary matrix', () => {
  it('rejects every stage except the first when its prerequisite is missing', () => {
    for (const stage of expeditionStageDefinitions.slice(1)) {
      const before = base();
      const result = resolveExpeditionFinish(before, stage.id, stage.target * 2);

      expect(result.summary.accepted, stage.id).toBe(false);
      expect(result.summary.cleared, stage.id).toBe(false);
      expect(result.summary.firstClear, stage.id).toBe(false);
      expect(result.state, stage.id).toEqual(before);
    }
  });

  it('keeps C failure separate from exact-B clear across all nine sequential stages', () => {
    let state = base();

    for (const stage of expeditionStageDefinitions) {
      const bThreshold = Math.ceil(stage.target * 0.8);
      const cScore = bThreshold - 1;
      const beforeFailure = state;
      const failed = resolveExpeditionFinish(beforeFailure, stage.id, cScore);

      expect(failed.summary.accepted, `${stage.id}: C accepted`).toBe(true);
      expect(failed.summary.grade, `${stage.id}: C grade`).toBe('C');
      expect(failed.summary.cleared, `${stage.id}: C cleared`).toBe(false);
      expect(failed.summary.firstClear, `${stage.id}: C firstClear`).toBe(false);
      expect(failed.summary.materialReward, `${stage.id}: C material`).toBe(0);
      expect(failed.summary.discovery, `${stage.id}: C discovery`).toBeNull();
      expect(failed.summary.storyUnlocked, `${stage.id}: C story`).toBe(false);
      expect(failed.summary.bossBadge, `${stage.id}: C badge`).toBe(false);
      expect(failed.summary.regionCompleted, `${stage.id}: C region`).toBeNull();
      expect(failed.state.rewardedExpeditionStages, `${stage.id}: C reward marker`).toEqual(beforeFailure.rewardedExpeditionStages);
      expect(failed.state.expeditionStoryEntries, `${stage.id}: C story marker`).toEqual(beforeFailure.expeditionStoryEntries);
      expect(failed.state.expeditionDiscoveries, `${stage.id}: C discovery marker`).toEqual(beforeFailure.expeditionDiscoveries);
      expect(failed.state.gold, `${stage.id}: C gold`).toBe(beforeFailure.gold);
      expect(failed.state.gems, `${stage.id}: C gems`).toBe(beforeFailure.gems);

      const cleared = resolveExpeditionFinish(failed.state, stage.id, bThreshold);
      expect(cleared.summary.accepted, `${stage.id}: B accepted`).toBe(true);
      expect(cleared.summary.grade, `${stage.id}: B grade`).toBe('B');
      expect(cleared.summary.cleared, `${stage.id}: B cleared`).toBe(true);
      expect(cleared.summary.firstClear, `${stage.id}: B firstClear`).toBe(true);
      expect(cleared.state.expeditionRecords[stage.id].cleared, `${stage.id}: durable clear`).toBe(true);

      const failedReplay = resolveExpeditionFinish(cleared.state, stage.id, cScore);
      expect(failedReplay.summary.accepted, `${stage.id}: failed replay accepted`).toBe(true);
      expect(failedReplay.summary.cleared, `${stage.id}: failed replay cleared`).toBe(false);
      expect(failedReplay.summary.firstClear, `${stage.id}: failed replay firstClear`).toBe(false);
      expect(failedReplay.summary.materialReward, `${stage.id}: failed replay material`).toBe(0);
      expect(failedReplay.state.expeditionRecords[stage.id].cleared, `${stage.id}: failed replay durable clear`).toBe(true);
      expect(failedReplay.state.gold, `${stage.id}: failed replay gold`).toBe(cleared.state.gold);
      expect(failedReplay.state.gems, `${stage.id}: failed replay gems`).toBe(cleared.state.gems);

      state = cleared.state;
    }
  });
});