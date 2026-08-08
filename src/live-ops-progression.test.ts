import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';

describe('live ops reducer progression', () => {
  it('hydrates legacy saves with empty live ops state', () => {
    const hydrated = hydrateGameState({ ...initialState,
      seasonJourneyScores:undefined,
      claimedSeasonJourneyTiers:undefined,
      seasonTokenBalances:undefined,
      weeklyDirectiveKey:undefined,
      weeklyDirectiveProgress:undefined,
      rewardedWeeklyDirectives:undefined,
      seasonJourneyHistory:undefined,
    });
    expect(hydrated.seasonJourneyScores).toEqual({});
    expect(hydrated.seasonTokenBalances).toEqual({});
    expect(hydrated.weeklyDirectiveProgress).toEqual({});
    expect(hydrated.seasonJourneyHistory).toEqual([]);
  });

  it('adds account season journey points for a successful outing', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const next = reducer(initialState,{ type:'GO_OUTING', location:'forest' });
    expect(next.seasonJourneyScores[key]).toBe(10);
  });

  it('adds grade-based journey points for an expedition clear', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const next = reducer(initialState,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
    expect(next.lastExpeditionResult?.grade).toBe('S');
    expect(next.seasonJourneyScores[key]).toBe(30);
  });

  it('auto-claims newly crossed journey tiers and credits season tokens', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, seasonJourneyScores:{ [key]:40 } };
    const next = reducer(state,{ type:'GO_OUTING', location:'forest' });
    expect(next.seasonJourneyScores[key]).toBe(50);
    expect(next.claimedSeasonJourneyTiers).toContain(`${key}:1`);
    expect(next.seasonTokenBalances[key]).toBe(10);
    expect(next.gold).toBeGreaterThan(state.gold);
  });

  it('preserves seasonal history-ready scores across month changes', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, screen:'result' as const, seasonJourneyScores:{ [key]:200 }, seasonTokenBalances:{ [key]:33 } };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.seasonJourneyScores[key]).toBeGreaterThanOrEqual(200);
    expect(next.seasonTokenBalances[key]).toBeGreaterThanOrEqual(33);
  });
});
