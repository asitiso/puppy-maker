import { describe, expect, it } from 'vitest';
import { currentStoryChapters, initialState, reducer } from './game-base';

describe('Bond -> Story same-action ordering', () => {
  it('lets a gift unlock shared-secret bond and dependent story chapters in the same reducer action', () => {
    const ready = {
      ...initialState,
      stats:{ ...initialState.stats, affection:69 },
      memories:['first_training'] as typeof initialState.memories,
      visitedOutings:['forest','village','lakeside'] as typeof initialState.visitedOutings,
      careerRecords:{ ...initialState.careerRecords, outings:3 },
      mastery:{ hunt:{xp:18}, magic:{xp:18}, rest:{xp:18}, herb:{xp:18} },
      activeCalling:'caretaker' as const,
      callingHistory:['caretaker' as const],
    };

    const after = reducer(ready, { type:'GIVE_GIFT', item:'star_cookie' });

    expect(after.stats.affection).toBe(75);
    expect(after.unlockedBondScenes).toContain('shared_secret');
    expect(currentStoryChapters(after)).toContain('trusted_bond');
    expect(currentStoryChapters(after)).toContain('guardian_oath');
    expect(after.rewardedStoryChapters).toContain('trusted_bond');
    expect(after.rewardedStoryChapters).toContain('guardian_oath');
  });

  it('does not pay Bond or Story rewards again on a replay reconciliation', () => {
    const ready = {
      ...initialState,
      stats:{ ...initialState.stats, affection:69 },
      memories:['first_training'] as typeof initialState.memories,
      visitedOutings:['forest','village','lakeside'] as typeof initialState.visitedOutings,
      careerRecords:{ ...initialState.careerRecords, outings:3 },
      mastery:{ hunt:{xp:18}, magic:{xp:18}, rest:{xp:18}, herb:{xp:18} },
      activeCalling:'caretaker' as const,
      callingHistory:['caretaker' as const],
    };
    const first = reducer(ready, { type:'GIVE_GIFT', item:'star_cookie' });
    const replay = reducer(first, { type:'SET_MONTHLY_FOCUS', focus:'balanced' });

    expect(replay.gold).toBe(first.gold);
    expect(replay.gems).toBe(first.gems);
    expect(replay.unlockedBondScenes).toEqual(first.unlockedBondScenes);
    expect(replay.rewardedBondScenes).toEqual(first.rewardedBondScenes);
    expect(replay.rewardedStoryChapters).toEqual(first.rewardedStoryChapters);
  });
});
