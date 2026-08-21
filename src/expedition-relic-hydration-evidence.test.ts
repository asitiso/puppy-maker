import { describe, expect, it } from 'vitest';
import { expeditionRegionDefinitions, isExpeditionStageUnlocked } from './expedition-regions';
import { hydrateExpeditionPersistentState } from './expedition-state';

describe('expedition relic hydration evidence', () => {
  it('uses a region completion relic as durable evidence that its region stages were cleared', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {},
      ownedExpeditionRelics: ['moonfang_charm'],
      rewardedExpeditionRegions: [],
    });

    for (const stageId of expeditionRegionDefinitions[0].stages) {
      expect(state.expeditionRecords[stageId].cleared).toBe(true);
    }
    expect(isExpeditionStageUnlocked('city_square', state.expeditionRecords)).toBe(true);
  });

  it('uses the forest boss bond locket as durable evidence that the forest chain was cleared', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {},
      ownedExpeditionRelics: ['bond_locket'],
      rewardedExpeditionRegions: [],
    });

    for (const stageId of expeditionRegionDefinitions[0].stages) {
      expect(state.expeditionRecords[stageId].cleared).toBe(true);
    }
    expect(isExpeditionStageUnlocked('city_square', state.expeditionRecords)).toBe(true);
  });

  it('uses the full-completion relic as durable evidence that all expedition stages were cleared', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {},
      ownedExpeditionRelics: ['explorer_compass'],
      rewardedExpeditionRegions: [],
      rewardedExpeditionStages: [],
    });

    for (const region of expeditionRegionDefinitions) {
      for (const stageId of region.stages) {
        expect(state.expeditionRecords[stageId].cleared).toBe(true);
      }
    }
  });
});
