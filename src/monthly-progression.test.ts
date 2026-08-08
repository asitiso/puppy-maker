import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('monthly challenge progression', () => {
  it('hydrates legacy saves with zero monthly progress and streak', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.monthlyCounters).toEqual({ trainings: 0, outings: 0, gifts: 0 });
    expect(state.rewardedMonthlyMissions).toEqual([]);
    expect(state.growthStreak).toBe(0);
  });

  it('sanitizes malformed monthly progress', () => {
    const state = hydrateGameState({ ...initialState, monthlyCounters:{trainings:-3,outings:2.8,gifts:'bad'}, rewardedMonthlyMissions:['training_once','bad','training_once'], growthStreak:-4 });
    expect(state.monthlyCounters).toEqual({ trainings:0, outings:2, gifts:0 });
    expect(state.rewardedMonthlyMissions).toEqual(['training_once']);
    expect(state.growthStreak).toBe(0);
  });

  it('rewards the training mission exactly once', () => {
    const first = reducer(initialState, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(first.monthlyCounters.trainings).toBe(1);
    expect(first.gold).toBe(initialState.gold + 120);
    expect(first.rewardedMonthlyMissions).toContain('training_once');
    const second = reducer({ ...first, screen:'training' }, { type:'FINISH_TRAINING', eventRoll:0.999 });
    expect(second.monthlyCounters.trainings).toBe(2);
    expect(second.gold).toBe(first.gold);
  });

  it('rewards the outing mission on the second outing and story on the third unique outing', () => {
    const first = reducer(initialState, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });
    expect(first.monthlyCounters.outings).toBe(1);
    expect(first.gems).toBe(initialState.gems);
    const second = reducer(first, { type:'GO_OUTING', location:'village', eventRoll:0.999 });
    expect(second.monthlyCounters.outings).toBe(2);
    expect(second.gems).toBe(initialState.gems + 1);
    const third = reducer(second, { type:'GO_OUTING', location:'lakeside', eventRoll:0.999 });
    expect(third.gems).toBe(second.gems + 1);
    expect(third.rewardedStoryChapters).toContain('wide_world');
  });

  it('only counts a gift when an item is actually consumed', () => {
    const empty = { ...initialState, inventory:{...initialState.inventory, herb_tea:0} };
    const noOp = reducer(empty, { type:'GIVE_GIFT', item:'herb_tea' });
    expect(noOp).toBe(empty);
    expect(noOp.monthlyCounters.gifts).toBe(0);
    const gifted = reducer(initialState, { type:'GIVE_GIFT', item:'star_cookie' });
    expect(gifted.monthlyCounters.gifts).toBe(1);
    expect(gifted.gold).toBe(initialState.gold + 100);
  });

  it('increments the growth streak and resets monthly progress after a completed month', () => {
    const complete = { ...initialState, monthlyCounters:{trainings:1,outings:2,gifts:1}, rewardedMonthlyMissions:['training_once','outing_twice','gift_once'] as typeof initialState.rewardedMonthlyMissions };
    const next = reducer({ ...complete, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.growthStreak).toBe(1);
    expect(next.monthlyCounters).toEqual({ trainings:0,outings:0,gifts:0 });
    expect(next.rewardedMonthlyMissions).toEqual([]);
  });

  it('resets the streak when a month is incomplete', () => {
    const incomplete = { ...initialState, growthStreak:2, monthlyCounters:{trainings:1,outings:1,gifts:1}, rewardedMonthlyMissions:['training_once','gift_once'] as typeof initialState.rewardedMonthlyMissions };
    const next = reducer({ ...incomplete, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.growthStreak).toBe(0);
  });

  it('grants a three-gem bonus on every third consecutive completed month', () => {
    const complete = { ...initialState, growthStreak:2, monthlyCounters:{trainings:1,outings:2,gifts:1}, rewardedMonthlyMissions:['training_once','outing_twice','gift_once'] as typeof initialState.rewardedMonthlyMissions };
    const next = reducer({ ...complete, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.growthStreak).toBe(3);
    expect(next.gems).toBe(initialState.gems + 3);
  });
});
