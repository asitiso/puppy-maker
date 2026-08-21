import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';
import { weeklyDirectiveKey, weeklyDirectives } from './weekly-directives';

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

  it('does not leak previous-week directive progress into a new week', () => {
    const previousWeek = 2;
    const currentWeek = 3;
    const previousKey = weeklyDirectiveKey(1,4,previousWeek);
    const currentKey = weeklyDirectiveKey(1,4,currentWeek);
    const previousDirectives = weeklyDirectives(1,4,previousWeek);
    const currentDirectives = weeklyDirectives(1,4,currentWeek);
    const staleId = previousDirectives.map(item => item.id).find(id => !currentDirectives.some(item => item.id === id));
    expect(staleId).toBeDefined();
    const state = {
      ...initialState,
      week:currentWeek,
      weeklyDirectiveKey:previousKey,
      weeklyDirectiveProgress:{ [staleId!]:99, unknown_directive:99 },
    };
    const next = reducer(state,{ type:'GO_OUTING', location:'forest' });
    expect(next.weeklyDirectiveKey).toBe(currentKey);
    expect(Object.keys(next.weeklyDirectiveProgress).sort()).toEqual(currentDirectives.map(item => item.id).sort());
    expect(next.weeklyDirectiveProgress).not.toHaveProperty(staleId!);
    expect(next.weeklyDirectiveProgress).not.toHaveProperty('unknown_directive');
  });

  it('does not duplicate a weekly reward after save hydration', () => {
    const week = [1,2,3,4].find(candidate => weeklyDirectives(1,4,candidate).some(item => item.counter === 'outing'))!;
    const weekKey = weeklyDirectiveKey(1,4,week);
    const directives = weeklyDirectives(1,4,week);
    const target = directives.find(item => item.counter === 'outing')!;
    const journeyKey = seasonJourneyKey(1,4);
    const hydrated = hydrateGameState({
      ...initialState,
      week,
      seasonJourneyScores:{ [journeyKey]:0 },
      seasonTokenBalances:{ [journeyKey]:7 },
      weeklyDirectiveKey:weekKey,
      weeklyDirectiveProgress:{ [target.id]:target.target },
      rewardedWeeklyDirectives:[`${weekKey}:${target.id}`,`${weekKey}:${target.id}`],
    });
    expect(hydrated.rewardedWeeklyDirectives).toEqual([`${weekKey}:${target.id}`]);

    const next = reducer(hydrated,{ type:'GO_OUTING', location:'forest' });
    expect(next.seasonJourneyScores[journeyKey]).toBe(10);
    expect(next.seasonTokenBalances[journeyKey]).toBe(7);
    expect(next.lastLiveOpsProgress?.weeklyCompleted).toEqual([]);
    expect(next.lastLiveOpsProgress?.tokensEarned).toBe(0);
  });

  it('preserves seasonal history-ready scores across month changes', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, screen:'result' as const, seasonJourneyScores:{ [key]:200 }, seasonTokenBalances:{ [key]:33 } };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.seasonJourneyScores[key]).toBeGreaterThanOrEqual(200);
    expect(next.seasonTokenBalances[key]).toBeGreaterThanOrEqual(33);
  });
});
