import { describe, expect, it } from 'vitest';
import { resolveExpeditionFinish } from './expedition-rewards';
import { expeditionStageDefinitions } from './expedition-regions';
import { emptyExpeditionPersistentState, hydrateExpeditionPersistentState } from './expedition-state';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold:0,
  gems:0,
  affection:0,
  inventory:{ star_cookie:0, herb_tea:0, fox_charm:0 },
});

function clearWorld() {
  let state = base();
  for (const stage of expeditionStageDefinitions) {
    state = resolveExpeditionFinish(state, stage.id, stage.target).state;
  }
  return state;
}

function expectUnique(items:readonly string[]) {
  expect(new Set(items).size).toBe(items.length);
}

describe('expedition long-run stress invariants', () => {
  it('does not leak success progression through one thousand failed attempts', () => {
    let state = base();

    for (let index = 0; index < 1000; index += 1) {
      const result = resolveExpeditionFinish(state, 'forest_path', 100);
      expect(result.summary.accepted).toBe(true);
      expect(result.summary.cleared).toBe(false);
      state = result.state;
    }

    expect(state.expeditionRecords.forest_path).toEqual({ bestScore:100, bestGrade:'C', cleared:false });
    expect(state.rewardedExpeditionStages).toEqual([]);
    expect(state.rewardedExpeditionRegions).toEqual([]);
    expect(state.expeditionStoryEntries).toEqual([]);
    expect(state.expeditionDiscoveries).toEqual([]);
    expect(state.expeditionMaterials).toEqual({ star_bark:0, arcane_shard:0, wind_pearl:0 });
    expect(state.ownedExpeditionRelics).toEqual([]);
    expect(state.gold).toBe(0);
    expect(state.gems).toBe(0);
  });

  it('keeps one-time world and boss rewards idempotent across repeated hydrate and re-entry', () => {
    let state = clearWorld();
    const baseline = {
      gold:state.gold,
      gems:state.gems,
      rewardedStages:[...state.rewardedExpeditionStages],
      rewardedRegions:[...state.rewardedExpeditionRegions],
      story:[...state.expeditionStoryEntries],
      discoveries:[...state.expeditionDiscoveries],
      relics:[...state.ownedExpeditionRelics],
    };

    for (let index = 0; index < 500; index += 1) {
      state = resolveExpeditionFinish(state, 'lake_tempest', 1750).state;
      const hydrated = hydrateExpeditionPersistentState(JSON.parse(JSON.stringify(state)));
      state = { ...state, ...hydrated };
    }

    expect(state.gold).toBe(baseline.gold);
    expect(state.gems).toBe(baseline.gems);
    expect(state.rewardedExpeditionStages).toEqual(baseline.rewardedStages);
    expect(state.rewardedExpeditionRegions).toEqual(baseline.rewardedRegions);
    expect(state.expeditionStoryEntries).toEqual(baseline.story);
    expect(state.expeditionDiscoveries).toEqual(baseline.discoveries);
    expect(state.ownedExpeditionRelics).toEqual(baseline.relics);
    expectUnique(state.rewardedExpeditionStages);
    expectUnique(state.rewardedExpeditionRegions);
    expectUnique(state.expeditionStoryEntries);
    expectUnique(state.expeditionDiscoveries);
    expectUnique(state.ownedExpeditionRelics);
  });

  it('keeps repeatable compass material rewards exactly linear without replaying one-time currency', () => {
    let state = clearWorld();
    state = { ...state, equippedExpeditionRelics:['explorer_compass'] };
    const baselineGold = state.gold;
    const baselineGems = state.gems;
    const baselineBark = state.expeditionMaterials.star_bark;

    for (let index = 0; index < 1000; index += 1) {
      const result = resolveExpeditionFinish(state, 'forest_path', 840);
      expect(result.summary.grade).toBe('S');
      expect(result.summary.firstClear).toBe(false);
      expect(result.summary.materialReward).toBe(3);
      state = result.state;
    }

    expect(state.expeditionMaterials.star_bark).toBe(baselineBark + 3000);
    expect(state.gold).toBe(baselineGold);
    expect(state.gems).toBe(baselineGems);
    expect(state.rewardedExpeditionStages.filter(id => id === 'forest_path')).toHaveLength(1);
    expect(state.expeditionStoryEntries.filter(id => id === 'forest_path')).toHaveLength(1);
    expect(state.expeditionDiscoveries.filter(id => id === 'forest_path_discovery')).toHaveLength(1);
  });
});
