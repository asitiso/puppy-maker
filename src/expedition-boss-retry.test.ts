import { describe, expect, it } from 'vitest';
import { resolveExpeditionFinish } from './expedition-rewards';
import { isExpeditionStageUnlocked } from './expedition-regions';
import { emptyExpeditionPersistentState } from './expedition-state';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold: 1000,
  gems: 10,
  affection: 50,
  inventory: { star_cookie: 0, herb_tea: 0, fox_charm: 0 },
});

describe('expedition boss failure and retry', () => {
  it('keeps the next region locked on failure, then unlocks and rewards exactly once on retry clear', () => {
    let state = base();
    state = resolveExpeditionFinish(state, 'forest_path', 700).state;
    state = resolveExpeditionFinish(state, 'forest_glade', 850).state;

    const beforeBoss = state;
    const failed = resolveExpeditionFinish(beforeBoss, 'forest_guardian', 100);

    expect(failed.summary.accepted).toBe(true);
    expect(failed.summary.cleared).toBe(false);
    expect(failed.summary.firstClear).toBe(false);
    expect(failed.summary.bossBadge).toBe(false);
    expect(failed.summary.regionCompleted).toBeNull();
    expect(failed.summary.relicsUnlocked).toEqual([]);
    expect(failed.state.gold).toBe(beforeBoss.gold);
    expect(failed.state.gems).toBe(beforeBoss.gems);
    expect(failed.state.rewardedExpeditionStages).not.toContain('forest_guardian');
    expect(failed.state.rewardedExpeditionRegions).not.toContain('starlight_forest');
    expect(failed.state.ownedExpeditionRelics).not.toContain('bond_locket');
    expect(failed.state.ownedExpeditionRelics).not.toContain('moonfang_charm');
    expect(isExpeditionStageUnlocked('city_square', failed.state.expeditionRecords)).toBe(false);

    const cleared = resolveExpeditionFinish(failed.state, 'forest_guardian', 840);

    expect(cleared.summary.grade).toBe('B');
    expect(cleared.summary.cleared).toBe(true);
    expect(cleared.summary.firstClear).toBe(true);
    expect(cleared.summary.bossBadge).toBe(true);
    expect(cleared.summary.regionCompleted).toBe('starlight_forest');
    expect(cleared.state.gold).toBe(failed.state.gold + 500);
    expect(cleared.state.gems).toBe(failed.state.gems + 2);
    expect(cleared.state.rewardedExpeditionStages.filter(id => id === 'forest_guardian')).toHaveLength(1);
    expect(cleared.state.rewardedExpeditionRegions.filter(id => id === 'starlight_forest')).toHaveLength(1);
    expect(cleared.state.ownedExpeditionRelics).toEqual(expect.arrayContaining(['bond_locket', 'moonfang_charm']));
    expect(isExpeditionStageUnlocked('city_square', cleared.state.expeditionRecords)).toBe(true);

    const replay = resolveExpeditionFinish(cleared.state, 'forest_guardian', 1050);

    expect(replay.summary.cleared).toBe(true);
    expect(replay.summary.firstClear).toBe(false);
    expect(replay.summary.bossBadge).toBe(false);
    expect(replay.summary.regionCompleted).toBeNull();
    expect(replay.state.gold).toBe(cleared.state.gold);
    expect(replay.state.gems).toBe(cleared.state.gems);
    expect(replay.state.rewardedExpeditionStages.filter(id => id === 'forest_guardian')).toHaveLength(1);
    expect(replay.state.rewardedExpeditionRegions.filter(id => id === 'starlight_forest')).toHaveLength(1);
    expect(replay.state.ownedExpeditionRelics.filter(id => id === 'bond_locket')).toHaveLength(1);
    expect(replay.state.ownedExpeditionRelics.filter(id => id === 'moonfang_charm')).toHaveLength(1);
    expect(isExpeditionStageUnlocked('city_square', replay.state.expeditionRecords)).toBe(true);
  });
});
