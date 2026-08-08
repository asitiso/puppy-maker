import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('persistent exploration progression', () => {
  it('hydrates legacy saves with zero exploration xp and no discoveries', () => {
    const hydrated = hydrateGameState({
      screen: 'hub', year: 1, month: 4, week: 2, gold: 5000, gems: 220,
      schedule: ['hunt', 'magic', 'rest', 'herb'], stats: { ...initialState.stats }, combo: 0, trainingScore: 0,
    });
    expect(hydrated.explorationXp).toEqual({ forest: 0, village: 0, lakeside: 0 });
    expect(hydrated.discoveries).toEqual([]);
  });

  it('sanitizes malformed exploration progress', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      explorationXp: { forest: -2, village: 3.9, lakeside: 'bad' },
      discoveries: ['moon_feather', 'bad', 'moon_feather', 'glass_shell'],
    });
    expect(hydrated.explorationXp).toEqual({ forest: 0, village: 3, lakeside: 0 });
    expect(hydrated.discoveries).toEqual(['moon_feather', 'glass_shell']);
  });

  it('adds one exploration xp while preserving the existing outing reward loop', () => {
    const beforeCookies = initialState.inventory.star_cookie;
    const result = reducer(initialState, { type: 'GO_OUTING', location: 'forest', eventRoll: 0.999 });
    expect(result.explorationXp.forest).toBe(1);
    expect(result.inventory.star_cookie).toBe(beforeCookies + 1);
    expect(result.memories).toContain('first_outing');
    expect(result.memories).toContain('forest_memory');
  });

  it('applies a location event reward and first-outing bond reward without removing the standard outing reward', () => {
    const result = reducer(initialState, { type: 'GO_OUTING', location: 'forest', eventRoll: 0 });
    expect(result.explorationXp.forest).toBe(1);
    expect(result.gold).toBe(initialState.gold + 150);
    expect(result.inventory.star_cookie).toBe(initialState.inventory.star_cookie + 1);
    expect(result.unlockedBondScenes).toContain('favorite_place');
  });

  it('persists a newly discovered hidden item exactly once', () => {
    const levelTwo = {
      ...initialState,
      explorationXp: { ...initialState.explorationXp, forest: 3 },
    };
    const found = reducer(levelTwo, { type: 'GO_OUTING', location: 'forest', eventRoll: 0.5 });
    expect(found.discoveries).toContain('moon_feather');
    const repeat = reducer(found, { type: 'GO_OUTING', location: 'forest', eventRoll: 0.5 });
    expect(repeat.discoveries.filter(id => id === 'moon_feather')).toHaveLength(1);
  });

  it('keeps exploration progress through monthly advancement', () => {
    const explored = reducer(initialState, { type: 'GO_OUTING', location: 'lakeside', eventRoll: 0.999 });
    const nextMonth = reducer({ ...explored, screen: 'result' }, { type: 'NEXT_MONTH' });
    expect(nextMonth.explorationXp.lakeside).toBe(1);
    expect(nextMonth.discoveries).toEqual(explored.discoveries);
  });

  it('resets exploration progression on full reset', () => {
    const explored = {
      ...initialState,
      explorationXp: { forest: 12, village: 7, lakeside: 3 },
      discoveries: ['moon_feather', 'tiny_bell'] as typeof initialState.discoveries,
    };
    const reset = reducer(explored, { type: 'RESET' });
    expect(reset.explorationXp).toEqual({ forest: 0, village: 0, lakeside: 0 });
    expect(reset.discoveries).toEqual([]);
  });
});
