import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';

const winterClaims = Array.from({ length:10 },(_,index) => `1-winter:${index + 1}`);

const completedWinterState = () => ({
  ...initialState,
  screen:'result' as const,
  month:2,
  seasonJourneyScores:{ '1-winter':1300 },
  claimedSeasonJourneyTiers:winterClaims,
  seasonTokenBalances:{ '1-winter':120 },
});

describe('season completion honor progression', () => {
  it('hydrates only valid claimed season completion honors', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedSeasonCompletionHonors:['first_complete','bad','first_complete','eight_complete'],
    });
    expect(hydrated.claimedSeasonCompletionHonors).toEqual(['first_complete','eight_complete']);
  });

  it('archives a completed season and grants the first completion honor once', () => {
    const state = completedWinterState();
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.seasonJourneyHistory).toEqual(expect.arrayContaining([
      expect.objectContaining({ key:'1-winter', tiersCompleted:10 }),
    ]));
    expect(next.claimedSeasonCompletionHonors).toContain('first_complete');
    expect(next.gold).toBeGreaterThanOrEqual(state.gold + 300);
  });

  it('does not re-grant a claimed completion honor', () => {
    const unclaimed = completedWinterState();
    const claimed = {
      ...completedWinterState(),
      claimedSeasonCompletionHonors:['first_complete'] as ('first_complete')[],
    };
    const withReward = reducer(unclaimed,{ type:'NEXT_MONTH' });
    const withoutReward = reducer(claimed,{ type:'NEXT_MONTH' });
    expect(withoutReward.claimedSeasonCompletionHonors).toEqual(['first_complete']);
    expect(withReward.gold - withoutReward.gold).toBe(300);
  });
});
