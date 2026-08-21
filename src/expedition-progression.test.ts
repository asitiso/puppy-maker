import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { expeditionStageDefinitions } from './expedition-regions';

describe('expedition persistent progression', () => {
  it('hydrates legacy saves with safe expedition defaults', () => {
    const legacy = hydrateGameState({ year: 2, month: 6, gold: 1234 });
    expect(Object.keys(legacy.expeditionRecords)).toHaveLength(expeditionStageDefinitions.length);
    expect(legacy.expeditionMaterials).toEqual({ star_bark: 0, arcane_shard: 0, wind_pearl: 0 });
    expect(legacy.ownedExpeditionRelics).toEqual([]);
    expect(legacy.equippedExpeditionRelics).toEqual([]);
    expect(legacy.expeditionDiscoveries).toEqual([]);
    expect(legacy.expeditionStoryEntries).toEqual([]);
  });

  it('sanitizes invalid expedition save values and equipment', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      expeditionMaterials: { star_bark: -7, arcane_shard: 3.9, wind_pearl: 2 },
      ownedExpeditionRelics: ['moonfang_charm', 'moonfang_charm', 'bad_relic'],
      equippedExpeditionRelics: ['moonfang_charm', 'moonfang_charm', 'mana_prism', 'wind_feather', 'guardian_thread'],
      rewardedExpeditionStages: ['forest_path', 'bad_stage'],
      expeditionDiscoveries: ['forest_path_discovery', 'bad_discovery'],
    });
    expect(hydrated.expeditionMaterials).toEqual({ star_bark: 0, arcane_shard: 3, wind_pearl: 2 });
    expect(hydrated.ownedExpeditionRelics).toEqual(['moonfang_charm']);
    expect(hydrated.equippedExpeditionRelics).toEqual(['moonfang_charm']);
    expect(hydrated.rewardedExpeditionStages).toEqual(['forest_path']);
    expect(hydrated.expeditionDiscoveries).toEqual(['forest_path_discovery']);
  });

  it('preserves permanent expedition fields across NEXT_MONTH', () => {
    const state = {
      ...initialState,
      expeditionMaterials: { star_bark: 4, arcane_shard: 2, wind_pearl: 1 },
      ownedExpeditionRelics: ['moonfang_charm'] as const,
      equippedExpeditionRelics: ['moonfang_charm'] as const,
      rewardedExpeditionStages: ['forest_path'] as const,
      expeditionStoryEntries: ['forest_path'] as const,
    };
    const next = reducer(state as any, { type: 'NEXT_MONTH' });
    expect(next.expeditionMaterials).toEqual(state.expeditionMaterials);
    expect(next.ownedExpeditionRelics).toEqual(['moonfang_charm']);
    expect(next.equippedExpeditionRelics).toEqual(['moonfang_charm']);
    expect(next.rewardedExpeditionStages).toEqual(['forest_path']);
    expect(next.expeditionStoryEntries).toEqual(['forest_path']);
  });

  it('RESET clears expedition progression back to defaults', () => {
    const progressed = {
      ...initialState,
      expeditionMaterials: { star_bark: 9, arcane_shard: 8, wind_pearl: 7 },
      ownedExpeditionRelics: ['moonfang_charm'],
    } as any;
    const reset = reducer(progressed, { type: 'RESET' });
    expect(reset.expeditionMaterials).toEqual({ star_bark: 0, arcane_shard: 0, wind_pearl: 0 });
    expect(reset.ownedExpeditionRelics).toEqual([]);
  });

  it('FINISH_EXPEDITION_STAGE commits the reward pipeline into GameState', () => {
    const ready = reducer(initialState, { type:'GO', screen:'hub' });
    const next = reducer(ready, { type: 'FINISH_EXPEDITION_STAGE', stageId: 'forest_path', score: 700 } as any);
    expect(next.expeditionRecords.forest_path.cleared).toBe(true);
    expect(next.gold).toBe(ready.gold + 150);
    expect(next.expeditionMaterials.star_bark).toBe(1);
    expect(next.expeditionStoryEntries).toContain('forest_path');
    expect(next.expeditionDiscoveries).toContain('forest_path_discovery');
    expect(next.lastExpeditionResult?.stageId).toBe('forest_path');
  });

  it('equips only owned relics and supports unequip', () => {
    const owned = { ...initialState, ownedExpeditionRelics: ['moonfang_charm'] as any };
    const equipped = reducer(owned, { type: 'EQUIP_EXPEDITION_RELIC', relic: 'moonfang_charm' } as any);
    expect(equipped.equippedExpeditionRelics).toEqual(['moonfang_charm']);
    const rejected = reducer(equipped, { type: 'EQUIP_EXPEDITION_RELIC', relic: 'mana_prism' } as any);
    expect(rejected.equippedExpeditionRelics).toEqual(['moonfang_charm']);
    const removed = reducer(rejected, { type: 'UNEQUIP_EXPEDITION_RELIC', relic: 'moonfang_charm' } as any);
    expect(removed.equippedExpeditionRelics).toEqual([]);
  });

  it('crafts gifts and relics into the existing inventory/equipment economy', () => {
    const materials = { ...initialState, expeditionMaterials: { star_bark: 3, arcane_shard: 3, wind_pearl: 3 } };
    const gift = reducer(materials, { type: 'CRAFT_EXPEDITION_RECIPE', recipe: 'star_cookie_recipe' } as any);
    expect(gift.expeditionMaterials.star_bark).toBe(1);
    expect(gift.inventory.star_cookie).toBe(initialState.inventory.star_cookie + 1);
    expect(gift.craftingMilestones).toContain('crafted_star_cookie');

    const relicState = { ...initialState, expeditionMaterials: { star_bark: 3, arcane_shard: 3, wind_pearl: 3 } };
    const relic = reducer(relicState, { type: 'CRAFT_EXPEDITION_RECIPE', recipe: 'guardian_thread_recipe' } as any);
    expect(relic.ownedExpeditionRelics).toContain('guardian_thread');
    expect(relic.craftingMilestones).toContain('crafted_guardian_thread');
  });
});
