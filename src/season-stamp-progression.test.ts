import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('seasonal stamp progression', () => {
  it('hydrates legacy saves with no seasonal stamps', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.seasonStamps).toEqual([]);
  });

  it('awards the spring stamp and one gem on the first seasonal outing', () => {
    const next = reducer(initialState, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });
    expect(next.seasonStamps).toEqual(['spring']);
    expect(next.gems).toBe(initialState.gems + 1);
  });

  it('does not reward the same seasonal stamp twice', () => {
    const base = {
      ...initialState,
      monthlyCounters: { ...initialState.monthlyCounters, outings: 2 },
      rewardedMonthlyMissions: ['outing_twice'] as typeof initialState.rewardedMonthlyMissions,
    };
    const first = reducer(base, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });
    const second = reducer(first, { type:'GO_OUTING', location:'forest', eventRoll:0.999 });
    expect(second.seasonStamps).toEqual(['spring']);
    expect(second.gems).toBe(first.gems);
  });

  it('does not award a stamp at a non-seasonal outing', () => {
    const next = reducer(initialState, { type:'GO_OUTING', location:'village', eventRoll:0.999 });
    expect(next.seasonStamps).toEqual([]);
    expect(next.gems).toBe(initialState.gems);
  });

  it('preserves collected stamps when the month advances', () => {
    const state = { ...initialState, seasonStamps:['spring'] as typeof initialState.seasonStamps };
    const next = reducer({ ...state, screen:'result' }, { type:'NEXT_MONTH' });
    expect(next.seasonStamps).toEqual(['spring']);
  });
});
