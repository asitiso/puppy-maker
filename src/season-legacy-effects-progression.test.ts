import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';

describe('season legacy passive progression', () => {
  it('adds expedition legacy journey points and can cross a journey tier', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const ready = {
      ...initialState,
      unlockedSeasonLegacyNodes:['expedition_seed'] as ('expedition_seed')[],
      seasonJourneyScores:{ [key]:18 },
    };
    const next = reducer(ready,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:700 });
    expect(next.seasonJourneyScores[key]).toBe(40);
    expect(next.lastLiveOpsProgress?.journeyPoints).toBe(22);
  });

  it('adds bond legacy tokens when a weekly directive completes', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const ready = {
      ...initialState,
      unlockedSeasonLegacyNodes:['bond_seed'] as ('bond_seed')[],
      weeklyDirectiveKey:'1-4-1',
      weeklyDirectiveProgress:{ steady_training:1 },
    };
    const next = reducer(ready,{ type:'FINISH_TRAINING', eventRoll:0.99 });
    expect(next.lastLiveOpsProgress?.weeklyCompleted.length).toBeGreaterThanOrEqual(1);
    expect(next.seasonTokenBalances[key]).toBeGreaterThanOrEqual(1);
  });

  it('includes chronicle legacy journey bonus in the archived completed month season', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const ready = {
      ...initialState,
      screen:'result' as const,
      month:2,
      unlockedSeasonLegacyNodes:['chronicle_seed'] as ('chronicle_seed')[],
      seasonJourneyScores:{ [key]:100 },
    };
    const next = reducer(ready,{ type:'NEXT_MONTH' });
    expect(next.seasonJourneyScores[key]).toBeGreaterThanOrEqual(103);
    const archived = next.seasonJourneyHistory.find(entry => entry.key === key);
    expect(archived?.score).toBe(next.seasonJourneyScores[key]);
  });
});
