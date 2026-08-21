import { describe, expect, it } from 'vitest';
import { isExpeditionStageUnlocked } from './expedition-regions';
import { emptyExpeditionPersistentState, hydrateExpeditionPersistentState } from './expedition-state';

describe('expedition persistent state repair', () => {
  it('restores guardian thread ownership when its crafting milestone exists', () => {
    const state = hydrateExpeditionPersistentState({
      craftingMilestones:['crafted_guardian_thread'],
      ownedExpeditionRelics:[],
    });
    expect(state.craftingMilestones).toContain('crafted_guardian_thread');
    expect(state.ownedExpeditionRelics).toContain('guardian_thread');
  });

  it('restores the guardian thread crafting milestone when relic ownership survived', () => {
    const state = hydrateExpeditionPersistentState({
      craftingMilestones:[],
      ownedExpeditionRelics:['guardian_thread'],
    });

    expect(state.ownedExpeditionRelics).toContain('guardian_thread');
    expect(state.craftingMilestones).toContain('crafted_guardian_thread');
  });

  it('keeps only owned relics equipped after hydration', () => {
    const state = hydrateExpeditionPersistentState({
      ownedExpeditionRelics:['moonfang_charm'],
      equippedExpeditionRelics:['moonfang_charm','mana_prism'],
    });
    expect(state.equippedExpeditionRelics).toEqual(['moonfang_charm']);
  });

  it('drops stale and duplicate relic ids and keeps at most three valid equipped relics', () => {
    const state = hydrateExpeditionPersistentState({
      ownedExpeditionRelics:[
        'moonfang_charm',
        'moonfang_charm',
        'stale_relic',
        'mana_prism',
        'wind_feather',
        'guardian_thread',
      ],
      equippedExpeditionRelics:[
        'stale_relic',
        'mana_prism',
        'mana_prism',
        'wind_feather',
        'guardian_thread',
        'moonfang_charm',
      ],
    });

    expect(state.ownedExpeditionRelics).toEqual([
      'moonfang_charm',
      'mana_prism',
      'wind_feather',
      'guardian_thread',
    ]);
    expect(state.equippedExpeditionRelics).toEqual([
      'mana_prism',
      'wind_feather',
      'guardian_thread',
    ]);
  });

  it('recovers an old save with missing expedition fields to exact safe defaults', () => {
    expect(hydrateExpeditionPersistentState({})).toEqual(emptyExpeditionPersistentState());
    expect(hydrateExpeditionPersistentState(null)).toEqual(emptyExpeditionPersistentState());
  });

  it('sanitizes malformed record scores, grades, clears and material counts', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {
        forest_path: { bestScore: Number.POSITIVE_INFINITY, bestGrade: 'Z', cleared: false },
        forest_glade: { bestScore: -42.8, bestGrade: 'B', cleared: false },
        forest_guardian: { bestScore: 1050.9, bestGrade: 'C', cleared: true },
      },
      expeditionMaterials: {
        star_bark: Number.NaN,
        arcane_shard: -3,
        wind_pearl: 7.9,
      },
    });

    expect(state.expeditionRecords.forest_path).toEqual({ bestScore: 0, bestGrade: 'C', cleared: false });
    expect(state.expeditionRecords.forest_glade).toEqual({ bestScore: 0, bestGrade: 'B', cleared: true });
    expect(state.expeditionRecords.forest_guardian).toEqual({ bestScore: 1050, bestGrade: 'C', cleared: true });
    expect(state.expeditionMaterials).toEqual({ star_bark: 0, arcane_shard: 0, wind_pearl: 7 });
  });

  it('deduplicates durable marker lists and removes stale ids', () => {
    const state = hydrateExpeditionPersistentState({
      rewardedExpeditionStages:['forest_path','forest_path','stale_stage'],
      rewardedExpeditionRegions:['starlight_forest','starlight_forest','stale_region'],
      expeditionDiscoveries:['forest_path_discovery','forest_path_discovery','stale_discovery'],
      expeditionStoryEntries:['forest_path','forest_path','stale_stage'],
      craftingMilestones:['crafted_star_cookie','crafted_star_cookie','stale_milestone'],
    });

    expect(state.rewardedExpeditionStages).toEqual(['forest_path']);
    expect(state.rewardedExpeditionRegions).toEqual(['starlight_forest']);
    expect(state.expeditionDiscoveries).toEqual(['forest_path_discovery']);
    expect(state.expeditionStoryEntries).toEqual(['forest_path']);
    expect(state.craftingMilestones).toEqual(['crafted_star_cookie']);
  });

  it('uses a paid stage reward as durable clear evidence so old saves cannot soft-lock progression', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {},
      rewardedExpeditionStages: ['forest_path'],
    });

    expect(state.expeditionRecords.forest_path.cleared).toBe(true);
    expect(isExpeditionStageUnlocked('forest_glade', state.expeditionRecords)).toBe(true);
  });

  it('uses unlocked expedition story entries as clear evidence when reward markers are missing', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {},
      expeditionStoryEntries: ['forest_path'],
    });

    expect(state.expeditionRecords.forest_path.cleared).toBe(true);
    expect(isExpeditionStageUnlocked('forest_glade', state.expeditionRecords)).toBe(true);
  });

  it('uses a paid region reward as evidence that its whole stage chain was cleared', () => {
    const state = hydrateExpeditionPersistentState({
      expeditionRecords: {},
      rewardedExpeditionRegions: ['starlight_forest'],
    });

    expect(state.expeditionRecords.forest_path.cleared).toBe(true);
    expect(state.expeditionRecords.forest_glade.cleared).toBe(true);
    expect(state.expeditionRecords.forest_guardian.cleared).toBe(true);
    expect(isExpeditionStageUnlocked('city_square', state.expeditionRecords)).toBe(true);
  });
});
