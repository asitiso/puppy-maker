import { describe, expect, it } from 'vitest';
import { resolveExpeditionFinish } from './expedition-rewards';
import { emptyExpeditionPersistentState, hydrateExpeditionPersistentState } from './expedition-state';

const base = () => ({
  ...emptyExpeditionPersistentState(),
  gold: 1000,
  gems: 10,
  affection: 50,
  inventory: { star_cookie: 0, herb_tea: 0, fox_charm: 0 },
});

describe('expedition result reload and re-entry', () => {
  it('does not replay boss or region one-time rewards after persistent-state hydration', () => {
    let state = base();
    state = resolveExpeditionFinish(state, 'forest_path', 700).state;
    state = resolveExpeditionFinish(state, 'forest_glade', 850).state;
    const first = resolveExpeditionFinish(state, 'forest_guardian', 1050);

    const persisted = hydrateExpeditionPersistentState(JSON.parse(JSON.stringify(first.state)));
    const reloaded = { ...first.state, ...persisted };
    const replay = resolveExpeditionFinish(reloaded, 'forest_guardian', 1260);

    expect(replay.summary.accepted).toBe(true);
    expect(replay.summary.cleared).toBe(true);
    expect(replay.summary.firstClear).toBe(false);
    expect(replay.summary.bossBadge).toBe(false);
    expect(replay.summary.regionCompleted).toBeNull();
    expect(replay.state.gold).toBe(first.state.gold);
    expect(replay.state.gems).toBe(first.state.gems);
    expect(replay.state.rewardedExpeditionStages.filter(id => id === 'forest_guardian')).toHaveLength(1);
    expect(replay.state.rewardedExpeditionRegions.filter(id => id === 'starlight_forest')).toHaveLength(1);
    expect(replay.state.expeditionStoryEntries.filter(id => id === 'forest_guardian')).toHaveLength(1);
    expect(replay.state.ownedExpeditionRelics.filter(id => id === 'bond_locket')).toHaveLength(1);
    expect(replay.state.ownedExpeditionRelics.filter(id => id === 'moonfang_charm')).toHaveLength(1);
  });
});
