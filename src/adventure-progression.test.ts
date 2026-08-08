import { describe, expect, it } from 'vitest';
import { eligibleAchievements, hydrateGameState, initialState, reducer } from './game';

describe('outing inventory and gift progression', () => {
  it('hydrates legacy saves with starting inventory and no visits', () => {
    const legacy = {
      screen: 'hub',
      year: 1,
      month: 4,
      week: 2,
      gold: 5000,
      gems: 220,
      schedule: ['hunt', 'magic', 'rest', 'herb'],
      stats: { ...initialState.stats },
      combo: 0,
      trainingScore: 0,
    };
    const hydrated = hydrateGameState(legacy);
    expect(hydrated.inventory).toEqual({ star_cookie: 2, herb_tea: 1, fox_charm: 1 });
    expect(hydrated.visitedOutings).toEqual([]);
  });

  it('sanitizes malformed inventory and outing visits', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      inventory: { star_cookie: -4, herb_tea: 2.8, fox_charm: 'bad' },
      visitedOutings: ['forest', 'bad', 'forest', 'village'],
    });
    expect(hydrated.inventory).toEqual({ star_cookie: 0, herb_tea: 2, fox_charm: 1 });
    expect(hydrated.visitedOutings).toEqual(['forest', 'village']);
  });

  it('performs a first outing, rewards an item and records memories once', () => {
    const first = reducer(initialState, { type: 'GO_OUTING', location: 'forest' });
    expect(first.visitedOutings).toEqual(['forest']);
    expect(first.memories).toContain('first_outing');
    expect(first.memories).toContain('forest_memory');
    expect(first.inventory.star_cookie).toBe(initialState.inventory.star_cookie + 1);
    expect(first.stats.fatigue).toBe(initialState.stats.fatigue + 8);
    expect(first.personality.curiosity).toBe(initialState.personality.curiosity + 2);

    const repeat = reducer(first, { type: 'GO_OUTING', location: 'forest' });
    expect(repeat.visitedOutings).toEqual(['forest']);
    expect(repeat.memories.filter(id => id === 'forest_memory')).toHaveLength(1);
    expect(repeat.inventory.star_cookie).toBe(first.inventory.star_cookie + 1);
  });

  it('gives a gift, consumes one item and records first gift memory once', () => {
    const gifted = reducer(initialState, { type: 'GIVE_GIFT', item: 'star_cookie' });
    expect(gifted.inventory.star_cookie).toBe(initialState.inventory.star_cookie - 1);
    expect(gifted.stats.affection).toBe(initialState.stats.affection + 6);
    expect(gifted.stats.stress).toBe(initialState.stats.stress - 4);
    expect(gifted.memories).toContain('first_gift');

    const second = reducer(gifted, { type: 'GIVE_GIFT', item: 'star_cookie' });
    expect(second.memories.filter(id => id === 'first_gift')).toHaveLength(1);
  });

  it('does nothing when gifting an empty item slot', () => {
    const empty = {
      ...initialState,
      inventory: { ...initialState.inventory, herb_tea: 0 },
    };
    const result = reducer(empty, { type: 'GIVE_GIFT', item: 'herb_tea' });
    expect(result).toBe(empty);
  });

  it('unlocks explorer achievement after all three outings', () => {
    let state = reducer(initialState, { type: 'GO_OUTING', location: 'forest' });
    state = reducer(state, { type: 'GO_OUTING', location: 'village' });
    state = reducer(state, { type: 'GO_OUTING', location: 'lakeside' });
    expect(eligibleAchievements(state)).toContain('little_explorer');
  });

  it('unlocks thoughtful giver achievement after first gift', () => {
    const state = reducer(initialState, { type: 'GIVE_GIFT', item: 'fox_charm' });
    expect(eligibleAchievements(state)).toContain('thoughtful_giver');
  });

  it('keeps new achievement rewards claimable exactly once', () => {
    let state = reducer(initialState, { type: 'GO_OUTING', location: 'forest' });
    state = reducer(state, { type: 'GO_OUTING', location: 'village' });
    state = reducer(state, { type: 'GO_OUTING', location: 'lakeside' });
    const claimed = reducer(state, { type: 'CLAIM_ACHIEVEMENT', achievement: 'little_explorer' });
    expect(claimed.gold).toBe(state.gold + 300);
    const duplicate = reducer(claimed, { type: 'CLAIM_ACHIEVEMENT', achievement: 'little_explorer' });
    expect(duplicate.gold).toBe(claimed.gold);
  });
});
