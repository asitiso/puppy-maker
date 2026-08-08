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
      week:3,
      unlockedSeasonLegacyNodes:['bond_seed'] as ('bond_seed')[],
      weeklyDirectiveKey:'1-4-3',
      weeklyDirectiveProgress:{ steady_training:1 },
    };
    const next = reducer(ready,{ type:'FINISH_TRAINING', eventRoll:0.99 });
    expect(next.lastLiveOpsProgress?.weeklyCompleted).toContain('steady_training');
    expect(next.seasonTokenBalances[key]).toBe(5);
    expect(next.lastLiveOpsProgress?.tokensEarned).toBe(5);
  });

  it('includes chronicle legacy journey bonus in the archived completed month season', () => {
    const month = 2;
    const key = seasonJourneyKey(initialState.year,month);
    const ready = {
      ...initialState,
      screen:'result' as const,
      month,
      unlockedSeasonLegacyNodes:['chronicle_seed'] as ('chronicle_seed')[],
      seasonJourneyScores:{ [key]:100 },
    };
    const next = reducer(ready,{ type:'NEXT_MONTH' });
    expect(next.seasonJourneyScores[key]).toBeGreaterThanOrEqual(103);
    const archived = next.seasonJourneyHistory.find(entry => entry.key === key);
    expect(archived?.score).toBe(next.seasonJourneyScores[key]);
  });
});
