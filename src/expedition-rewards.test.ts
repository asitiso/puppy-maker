import { describe, expect, it } from 'vitest';
import { emptyExpeditionPersistentState } from './expedition-state';
import { resolveExpeditionFinish } from './expedition-rewards';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold: 1000,
  gems: 10,
  affection: 50,
  inventory: { star_cookie: 0, herb_tea: 0, fox_charm: 0 },
});

describe('expedition finish reward pipeline', () => {
  it('awards normal first clear gold, material, story and A discovery', () => {
    const result = resolveExpeditionFinish(base(), 'forest_path', 700);
    expect(result.state.gold).toBe(1150);
    expect(result.state.expeditionMaterials.star_bark).toBe(1);
    expect(result.state.expeditionStoryEntries).toContain('forest_path');
    expect(result.state.expeditionDiscoveries).toContain('forest_path_discovery');
    expect(result.summary.firstClear).toBe(true);
    expect(result.summary.cleared).toBe(true);
    expect(result.summary.grade).toBe('A');
  });

  it('does not award discovery on B but does on later A replay', () => {
    const first = resolveExpeditionFinish(base(), 'forest_path', 560);
    expect(first.summary.grade).toBe('B');
    expect(first.summary.cleared).toBe(true);
    expect(first.state.expeditionDiscoveries).not.toContain('forest_path_discovery');
    const replay = resolveExpeditionFinish(first.state, 'forest_path', 700);
    expect(replay.summary.firstClear).toBe(false);
    expect(replay.state.expeditionDiscoveries).toContain('forest_path_discovery');
    expect(replay.state.gold).toBe(first.state.gold);
  });

  it('gives two materials for S and explorer compass adds one more', () => {
    const state = { ...base(), ownedExpeditionRelics: ['explorer_compass'] as any, equippedExpeditionRelics: ['explorer_compass'] as any };
    const result = resolveExpeditionFinish(state, 'forest_path', 840);
    expect(result.summary.grade).toBe('S');
    expect(result.summary.materialReward).toBe(3);
    expect(result.state.expeditionMaterials.star_bark).toBe(3);
  });

  it('boss first clear is idempotent and grants its badge/reward', () => {
    let state: any = base();
    state = resolveExpeditionFinish(state, 'forest_path', 700).state;
    state = resolveExpeditionFinish(state, 'forest_glade', 850).state;
    const first = resolveExpeditionFinish(state, 'forest_guardian', 1050);
    expect(first.state.gold).toBe(state.gold + 500);
    expect(first.state.gems).toBe(state.gems + 2);
    expect(first.summary.bossBadge).toBe(true);
    const replay = resolveExpeditionFinish(first.state, 'forest_guardian', 1260);
    expect(replay.state.gold).toBe(first.state.gold);
    expect(replay.state.gems).toBe(first.state.gems);
    expect(replay.summary.firstClear).toBe(false);
    expect(replay.summary.cleared).toBe(true);
  });

  it('grants region relics and forest boss also makes bond locket obtainable', () => {
    let state: any = base();
    state = resolveExpeditionFinish(state, 'forest_path', 700).state;
    state = resolveExpeditionFinish(state, 'forest_glade', 850).state;
    state = resolveExpeditionFinish(state, 'forest_guardian', 1050).state;
    expect(state.ownedExpeditionRelics).toContain('moonfang_charm');
    expect(state.ownedExpeditionRelics).toContain('bond_locket');
    expect(state.rewardedExpeditionRegions).toContain('starlight_forest');
  });

  it('rejects attempts to finish a locked stage', () => {
    const result = resolveExpeditionFinish(base(), 'city_square', 5000);
    expect(result.summary.accepted).toBe(false);
    expect(result.summary.cleared).toBe(false);
    expect(result.state).toEqual(base());
  });

  it('does not replay first-clear currency when a cleared record is missing its reward marker', () => {
    const state = base();
    state.expeditionRecords.forest_path = { bestScore:700, bestGrade:'A', cleared:true };
    const replay = resolveExpeditionFinish(state, 'forest_path', 700);
    expect(replay.summary.firstClear).toBe(false);
    expect(replay.state.gold).toBe(state.gold);
    expect(replay.state.rewardedExpeditionStages).toContain('forest_path');
    expect(replay.state.expeditionStoryEntries).toContain('forest_path');
  });

  it('repairs missing region and world relics without replaying completion transitions', () => {
    const regionState = base();
    for (const id of ['forest_path','forest_glade','forest_guardian'] as const) {
      regionState.expeditionRecords[id] = { bestScore:2000, bestGrade:'A', cleared:true };
    }
    const regionReplay = resolveExpeditionFinish(regionState, 'forest_guardian', 1050);
    expect(regionReplay.summary.regionCompleted).toBeNull();
    expect(regionReplay.state.ownedExpeditionRelics).toContain('moonfang_charm');
    expect(regionReplay.state.ownedExpeditionRelics).toContain('bond_locket');

    const worldState = base();
    for (const id of Object.keys(worldState.expeditionRecords) as Array<keyof typeof worldState.expeditionRecords>) {
      worldState.expeditionRecords[id] = { bestScore:9999, bestGrade:'A', cleared:true };
    }
    const worldReplay = resolveExpeditionFinish(worldState, 'lake_tempest', 1750);
    expect(worldReplay.summary.fullCompleted).toBe(false);
    expect(worldReplay.state.gems).toBe(worldState.gems);
    expect(worldReplay.state.ownedExpeditionRelics).toContain('explorer_compass');
  });

  it('does not repair the world-completion relic on a failed replay', () => {
    const worldState = base();
    for (const id of Object.keys(worldState.expeditionRecords) as Array<keyof typeof worldState.expeditionRecords>) {
      worldState.expeditionRecords[id] = { bestScore:9999, bestGrade:'A', cleared:true };
    }
    const failedReplay = resolveExpeditionFinish(worldState, 'lake_tempest', 100);
    expect(failedReplay.summary.cleared).toBe(false);
    expect(failedReplay.summary.relicsUnlocked).toEqual([]);
    expect(failedReplay.state.ownedExpeditionRelics).not.toContain('explorer_compass');
  });

  it('separates an accepted C-grade attempt from a successful clear', () => {
    const result = resolveExpeditionFinish(base(), 'forest_path', 100);
    expect(result.summary.accepted).toBe(true);
    expect(result.summary.cleared).toBe(false);
    expect(result.summary.firstClear).toBe(false);
    expect(result.summary.materialReward).toBe(0);
    expect(result.state.expeditionRecords.forest_path.cleared).toBe(false);
  });
});
