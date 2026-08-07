import { describe, expect, it } from 'vitest';
import {
  collectionProgress,
  eligibleAchievements,
  hydrateGameState,
  initialState,
  reducer,
  relationshipRank,
  unlockedSkills,
} from './game';

describe('bond collection and achievements', () => {
  it('maps affection to stable relationship ranks', () => {
    expect(relationshipRank(0)).toBe('acquaintance');
    expect(relationshipRank(39)).toBe('acquaintance');
    expect(relationshipRank(40)).toBe('familiar');
    expect(relationshipRank(59)).toBe('familiar');
    expect(relationshipRank(60)).toBe('friend');
    expect(relationshipRank(74)).toBe('friend');
    expect(relationshipRank(75)).toBe('close_friend');
    expect(relationshipRank(89)).toBe('close_friend');
    expect(relationshipRank(90)).toBe('precious');
    expect(relationshipRank(100)).toBe('precious');
  });

  it('summarizes memories skills and mastered activities without duplicate state', () => {
    const state = {
      ...initialState,
      memories: ['first_training', 'first_hug', 'first_perfect'] as typeof initialState.memories,
      mastery: {
        hunt: { xp: 12 },
        magic: { xp: 3 },
        rest: { xp: 0 },
        herb: { xp: 7 },
      },
    };

    expect(unlockedSkills(state)).toEqual(['quick_strike', 'mana_focus', 'trail_instinct']);
    expect(collectionProgress(state)).toEqual({ memories: 3, skills: 3, masteredActivities: 1 });
  });

  it('derives achievement eligibility from existing progress', () => {
    const state = {
      ...initialState,
      stats: { ...initialState.stats, affection: 80 },
      memories: ['first_training', 'first_hug', 'first_perfect'] as typeof initialState.memories,
      mastery: { ...initialState.mastery, hunt: { xp: 12 } },
    };

    expect(eligibleAchievements(state)).toEqual([
      'first_steps',
      'skill_beginner',
      'memory_keeper',
      'close_bond',
      'mastery_specialist',
      'perfect_growth',
    ]);
  });

  it('grants a valid achievement reward exactly once', () => {
    const eligible = {
      ...initialState,
      memories: ['first_training'] as typeof initialState.memories,
    };
    const claimed = reducer(eligible, { type: 'CLAIM_ACHIEVEMENT', achievement: 'first_steps' });
    expect(claimed.gold).toBe(initialState.gold + 150);
    expect(claimed.claimedAchievements).toEqual(['first_steps']);

    const duplicate = reducer(claimed, { type: 'CLAIM_ACHIEVEMENT', achievement: 'first_steps' });
    expect(duplicate.gold).toBe(claimed.gold);
    expect(duplicate.claimedAchievements).toEqual(['first_steps']);
  });

  it('does not grant an ineligible achievement reward', () => {
    const result = reducer(initialState, { type: 'CLAIM_ACHIEVEMENT', achievement: 'close_bond' });
    expect(result.gold).toBe(initialState.gold);
    expect(result.gems).toBe(initialState.gems);
    expect(result.claimedAchievements).toEqual([]);
  });

  it('hydrates legacy and malformed achievement claims safely', () => {
    expect(hydrateGameState(initialState).claimedAchievements).toEqual([]);
    const hydrated = hydrateGameState({
      ...initialState,
      claimedAchievements: ['first_steps', 'not_real', 'first_steps'],
    });
    expect(hydrated.claimedAchievements).toEqual(['first_steps']);
  });

  it('records first skill memory once when mastery crosses a skill threshold', () => {
    const state = {
      ...initialState,
      schedule: ['hunt', 'rest', 'rest', 'rest'] as typeof initialState.schedule,
      mastery: { ...initialState.mastery, hunt: { xp: 2 } },
    };
    const first = reducer(state, { type: 'FINISH_TRAINING', eventRoll: 0.999 });
    expect(first.memories).toContain('first_skill');
    const second = reducer({ ...first, screen: 'training' }, { type: 'FINISH_TRAINING', eventRoll: 0.999 });
    expect(second.memories.filter(id => id === 'first_skill')).toHaveLength(1);
  });

  it('records close bond memory once when affection crosses the relationship threshold', () => {
    const state = {
      ...initialState,
      stats: { ...initialState.stats, affection: 74 },
    };
    const close = reducer(state, { type: 'CHOOSE', choice: 'hug' });
    expect(close.stats.affection).toBe(84);
    expect(close.memories).toContain('close_bond');
    const again = reducer({ ...close, screen: 'dialogue' }, { type: 'CHOOSE', choice: 'hug' });
    expect(again.memories.filter(id => id === 'close_bond')).toHaveLength(1);
  });
});
