import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('story chapter progression', () => {
  it('hydrates legacy saves with no rewarded story chapters', () => {
    const state = hydrateGameState({
      screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
      schedule: ['hunt', 'magic', 'rest', 'herb'], stats: { ...initialState.stats }, combo: 0, trainingScore: 0,
    });
    expect(state.rewardedStoryChapters).toEqual([]);
  });

  it('sanitizes malformed story reward claims in narrative order', () => {
    const state = hydrateGameState({
      ...initialState,
      rewardedStoryChapters: ['guardian_oath', 'bad', 'wide_world', 'wide_world'],
    });
    expect(state.rewardedStoryChapters).toEqual(['wide_world', 'guardian_oath']);
  });

  it('reconciles eligible story rewards exactly once from existing progress', () => {
    const ready = {
      ...initialState,
      memories: ['first_training'] as typeof initialState.memories,
      visitedOutings: ['forest', 'village', 'lakeside'] as typeof initialState.visitedOutings,
    };
    const opened = reducer(ready, { type: 'GO', screen: 'schedule' });
    expect(opened.rewardedStoryChapters).toEqual(['first_step', 'wide_world']);
    expect(opened.gems).toBe(initialState.gems + 1);

    const again = reducer(opened, { type: 'GO', screen: 'hub' });
    expect(again.rewardedStoryChapters).toEqual(opened.rewardedStoryChapters);
    expect(again.gems).toBe(opened.gems);
  });

  it('pays the final chapter reward when veteran progress and four discoveries are already met', () => {
    const advanced = {
      ...initialState,
      memories: [
        'first_training', 'first_perfect', 'first_hug', 'first_snack', 'first_s_grade', 'first_month_complete',
        'first_skill', 'close_bond', 'first_outing', 'forest_memory', 'village_memory', 'lakeside_memory', 'first_gift',
      ] as typeof initialState.memories,
      discoveries: ['moon_feather', 'star_mushroom', 'tiny_bell', 'old_spellbook'] as typeof initialState.discoveries,
      mastery: { hunt: { xp: 18 }, magic: { xp: 18 }, rest: { xp: 18 }, herb: { xp: 18 } },
      visitedOutings: ['forest','village','lakeside'] as typeof initialState.visitedOutings,
      unlockedBondScenes: ['shared_secret'] as typeof initialState.unlockedBondScenes,
      activeCalling: 'pathfinder' as const,
      rewardedGuardianRanks: ['junior', 'guardian', 'veteran'] as typeof initialState.rewardedGuardianRanks,
      rewardedStoryChapters: ['first_step', 'wide_world', 'trusted_bond', 'guardian_oath'] as typeof initialState.rewardedStoryChapters,
    };
    const opened = reducer(advanced, { type: 'GO', screen: 'schedule' });
    expect(opened.rewardedStoryChapters).toContain('starlight_road');
    expect(opened.gems).toBe(initialState.gems + 3);
  });

  it('preserves story reward claims across month advancement', () => {
    const state = {
      ...initialState,
      rewardedStoryChapters: ['first_step', 'wide_world'] as typeof initialState.rewardedStoryChapters,
    };
    const next = reducer({ ...state, screen: 'result' }, { type: 'NEXT_MONTH' });
    expect(next.rewardedStoryChapters).toEqual(['first_step', 'wide_world']);
  });
});
