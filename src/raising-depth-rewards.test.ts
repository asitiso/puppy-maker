import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('raising depth rewards and bond progression', () => {
  it('unlocks a bond scene only when the current action crosses its condition and rewards it once', () => {
    const ready = {
      ...initialState,
      stats: { ...initialState.stats, affection: 49 },
      monthlyCounters:{ ...initialState.monthlyCounters, gifts:1 },
      rewardedMonthlyMissions:['gift_once' as const],
    };
    const first = reducer(ready, { type:'GIVE_GIFT', item:'star_cookie' });
    expect(first.unlockedBondScenes).toContain('first_trust');
    expect(first.rewardedBondScenes).toContain('first_trust');
    expect(first.gold).toBe(ready.gold + 100);

    const again = reducer(first, { type:'SET_MONTHLY_FOCUS', focus:'balanced' });
    expect(again.gold).toBe(first.gold);
    expect(again.rewardedBondScenes.filter(id => id === 'first_trust')).toHaveLength(1);
  });

  it('does not retroactively reward a scene that was already eligible before an unrelated action', () => {
    const ready = {
      ...initialState,
      stats:{ ...initialState.stats, affection:55 },
    };
    const next = reducer(ready, { type:'SET_MONTHLY_FOCUS', focus:'balanced' });
    expect(next.unlockedBondScenes).toEqual([]);
    expect(next.rewardedBondScenes).toEqual([]);
    expect(next.gold).toBe(ready.gold);
  });

  it('grants one growth point every completed month and one extra for an S training month', () => {
    const normal = reducer({ ...initialState, growthPoints:0, trainingScore:650 }, { type:'NEXT_MONTH' });
    expect(normal.growthPoints).toBe(1);

    const sMonth = reducer({ ...initialState, growthPoints:0, trainingScore:950 }, { type:'NEXT_MONTH' });
    expect(sMonth.growthPoints).toBe(2);
  });

  it('grants active Calling mastery on month completion', () => {
    const state = {
      ...initialState,
      activeCalling:'vanguard' as const,
      callingHistory:['vanguard' as const],
      callingMastery:{ ...initialState.callingMastery, vanguard:2 },
    };
    const next = reducer(state, { type:'NEXT_MONTH' });
    expect(next.callingMastery.vanguard).toBe(3);
    expect(next.callingMastery.arcanist).toBe(0);
  });

  it('grants a growth point only on the first clear of each expedition boss', () => {
    const records = {
      ...initialState.expeditionRecords,
      forest_path:{ bestScore:900, bestGrade:'A' as const, cleared:true },
      forest_glade:{ bestScore:1000, bestGrade:'A' as const, cleared:true },
    };
    const ready = { ...initialState, expeditionRecords:records, growthPoints:0 };
    const first = reducer(ready, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_guardian', score:1300 });
    expect(first.growthPoints).toBe(1);
    expect(first.growthPointBossRewards).toContain('forest_guardian');

    const replay = reducer(first, { type:'FINISH_EXPEDITION_STAGE', stageId:'forest_guardian', score:1400 });
    expect(replay.growthPoints).toBe(1);
    expect(replay.growthPointBossRewards.filter(id => id === 'forest_guardian')).toHaveLength(1);
  });
});
