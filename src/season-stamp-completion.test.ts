import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';

describe('four-season guardian completion', () => {
  it('grants an extra three gems when the fourth unique season stamp is collected', () => {
    const state = {
      ...initialState,
      month: 12,
      seasonStamps: ['spring','summer','autumn'] as typeof initialState.seasonStamps,
      monthlyCounters: { ...initialState.monthlyCounters, outings: 2 },
      rewardedMonthlyMissions: ['outing_twice'] as typeof initialState.rewardedMonthlyMissions,
    };
    const next = reducer(state, { type:'GO_OUTING', location:'lakeside', eventRoll:0.999 });
    expect(next.seasonStamps).toEqual(['spring','summer','autumn','winter']);
    expect(next.gems).toBe(initialState.gems + 4);
  });

  it('never grants the four-season bonus after the collection is already complete', () => {
    const state = {
      ...initialState,
      month: 12,
      seasonStamps: ['spring','summer','autumn','winter'] as typeof initialState.seasonStamps,
      monthlyCounters: { ...initialState.monthlyCounters, outings: 2 },
      rewardedMonthlyMissions: ['outing_twice'] as typeof initialState.rewardedMonthlyMissions,
    };
    const next = reducer(state, { type:'GO_OUTING', location:'lakeside', eventRoll:0.999 });
    expect(next.gems).toBe(initialState.gems);
  });
});
