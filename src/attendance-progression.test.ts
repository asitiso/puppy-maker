import { describe, expect, it } from 'vitest';
import { attendanceKey } from './attendance';
import { hydrateGameState, initialState, reducer } from './game';

describe('attendance progression', () => {
  it('hydrates legacy saves with no attendance claims', () => {
    const state = hydrateGameState({ screen:'hub', year:1, month:4, week:2, gold:5000, gems:220, schedule:['hunt','magic','rest','herb'], stats:{...initialState.stats}, combo:0, trainingScore:0 });
    expect(state.claimedAttendanceMonths).toEqual([]);
  });

  it('sanitizes malformed attendance keys and removes duplicates', () => {
    const state = hydrateGameState({ ...initialState, claimedAttendanceMonths:['1-4','bad','1-4','2-12','0-1','3-13'] });
    expect(state.claimedAttendanceMonths).toEqual(['1-4','2-12']);
  });

  it('claims the current month reward exactly once', () => {
    const claimed = reducer(initialState, { type:'CLAIM_ATTENDANCE' });
    expect(claimed.claimedAttendanceMonths).toEqual([attendanceKey(1, 4)]);
    expect(claimed.gold).toBe(initialState.gold + 150);
    expect(claimed.gems).toBe(initialState.gems);

    const again = reducer(claimed, { type:'CLAIM_ATTENDANCE' });
    expect(again).toBe(claimed);
  });

  it('adds the quarterly gem bonus on eligible months', () => {
    const june = { ...initialState, month:6 };
    const claimed = reducer(june, { type:'CLAIM_ATTENDANCE' });
    expect(claimed.gold).toBe(june.gold + 150);
    expect(claimed.gems).toBe(june.gems + 1);
  });

  it('preserves old claims after advancing to a new month and allows the new claim', () => {
    const claimed = reducer(initialState, { type:'CLAIM_ATTENDANCE' });
    const nextMonth = reducer({ ...claimed, screen:'result' }, { type:'NEXT_MONTH' });
    expect(nextMonth.claimedAttendanceMonths).toContain('1-4');
    const mayClaim = reducer(nextMonth, { type:'CLAIM_ATTENDANCE' });
    expect(mayClaim.claimedAttendanceMonths).toEqual(['1-4','1-5']);
  });
});
