import { describe, expect, it } from 'vitest';
import { currentGuardianStatus, hydrateGameState, initialState, reducer } from './game';

describe('guardian rank progression', () => {
  it('hydrates legacy saves with no rewarded guardian ranks', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.rewardedGuardianRanks).toEqual([]);
  });

  it('sanitizes malformed rewarded ranks', () => {
    const state = hydrateGameState({ ...initialState, rewardedGuardianRanks:['junior','bad','junior','guardian'] });
    expect(state.rewardedGuardianRanks).toEqual(['junior','guardian']);
  });

  it('derives current guardian status from existing progress', () => {
    const state = {
      ...initialState,
      memories: ['first_training', 'first_hug', 'first_gift'] as typeof initialState.memories,
      discoveries: ['moon_feather'] as typeof initialState.discoveries,
      mastery: { hunt:{xp:7}, magic:{xp:3}, rest:{xp:0}, herb:{xp:0} },
    };
    const status = currentGuardianStatus(state);
    expect(status.points).toBe(8);
    expect(status.rank).toBe('junior');
    expect(status.next).toEqual({ rank:'guardian', threshold:16 });
  });

  it('automatically grants missing rank rewards once after progress crosses a threshold', () => {
    const nearRank = {
      ...initialState,
      memories: ['first_training', 'first_hug', 'first_month_complete', 'first_skill', 'close_bond', 'forest_memory', 'first_perfect'] as typeof initialState.memories,
      inventory: { ...initialState.inventory, star_cookie: 1 },
    };
    expect(currentGuardianStatus(nearRank).points).toBe(7);
    const ranked = reducer(nearRank, { type:'GIVE_GIFT', item:'star_cookie' });
    expect(currentGuardianStatus(ranked).rank).toBe('junior');
    expect(ranked.gems).toBe(initialState.gems + 1);
    expect(ranked.rewardedGuardianRanks).toEqual(['junior']);

    const again = reducer(ranked, { type:'GO', screen:'schedule' });
    expect(again.gems).toBe(ranked.gems);
    expect(again.rewardedGuardianRanks).toEqual(['junior']);
  });

  it('grants all missing lower-rank rewards when a save already qualifies for a higher rank', () => {
    const advanced = {
      ...initialState,
      memories: Array(13).fill('first_training') as typeof initialState.memories,
      discoveries: ['moon_feather','star_mushroom','tiny_bell'] as typeof initialState.discoveries,
      mastery: { hunt:{xp:18}, magic:{xp:18}, rest:{xp:18}, herb:{xp:18} },
    };
    const reconciled = reducer(advanced, { type:'GO', screen:'schedule' });
    expect(currentGuardianStatus(reconciled).rank).toBe('veteran');
    expect(reconciled.rewardedGuardianRanks).toEqual(['junior','guardian','veteran']);
    expect(reconciled.gems).toBe(initialState.gems + 6);
  });

  it('preserves guardian reward claims across month advancement', () => {
    const state = { ...initialState, rewardedGuardianRanks:['junior'] as typeof initialState.rewardedGuardianRanks };
    const next = reducer({ ...state, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.rewardedGuardianRanks).toEqual(['junior']);
  });
});
