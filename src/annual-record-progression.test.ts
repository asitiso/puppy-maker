import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

describe('annual record progression', () => {
  it('hydrates legacy saves with no annual records', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:1, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.annualRecords).toEqual([]);
  });

  it('does not create a record between ordinary months', () => {
    const next = reducer({ ...initialState, screen:'result', month:5 }, { type:'NEXT_MONTH' });
    expect(next.annualRecords).toEqual([]);
  });

  it('records a guardian snapshot when December advances to a new year', () => {
    const state = {
      ...initialState,
      screen:'result' as const,
      month:12,
      careerRecords:{ trainings:12, bestScore:1250, sGrades:3, outings:8, gifts:4, monthsCompleted:11 },
      seasonStamps:['spring','summer','autumn','winter'] as typeof initialState.seasonStamps,
    };
    const next = reducer(state, { type:'NEXT_MONTH' });
    expect(next.year).toBe(2);
    expect(next.month).toBe(1);
    expect(next.annualRecords).toHaveLength(1);
    expect(next.annualRecords[0]).toMatchObject({ year:1, trainings:12, outings:8, gifts:4, sGrades:3, bestScore:1250, seasonStamps:4 });
  });
});
