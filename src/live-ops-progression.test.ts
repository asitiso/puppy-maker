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
      seasonShopPurchases:undefined,
      seasonJourneyHistory:undefined,
    });
    expect(hydrated.seasonJourneyScores).toEqual({});
    expect(hydrated.seasonTokenBalances).toEqual({});
    expect(hydrated.weeklyDirectiveProgress).toEqual({});
    expect(hydrated.seasonShopPurchases).toEqual([]);
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

  it('buys season shop offers atomically and records deterministic purchase keys', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, seasonTokenBalances:{ [key]:30 } };
    const next = reducer(state,{ type:'BUY_SEASON_SHOP_OFFER', offerId:'gem_pouch' });
    expect(next.seasonTokenBalances[key]).toBe(18);
    expect(next.gems).toBe(state.gems + 3);
    expect(next.seasonShopPurchases).toEqual([`${key}:gem_pouch:1`]);
  });

  it('returns the same state when shop tokens are insufficient or a limit is exhausted', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const poor = { ...initialState, seasonTokenBalances:{ [key]:11 } };
    expect(reducer(poor,{ type:'BUY_SEASON_SHOP_OFFER', offerId:'gem_pouch' })).toBe(poor);
    const exhausted = { ...initialState, seasonTokenBalances:{ [key]:99 }, seasonShopPurchases:[`${key}:gem_pouch:1`,`${key}:gem_pouch:2`] };
    expect(reducer(exhausted,{ type:'BUY_SEASON_SHOP_OFFER', offerId:'gem_pouch' })).toBe(exhausted);
  });

  it('applies gift and recovery shop rewards without adding another inventory system', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, seasonTokenBalances:{ [key]:40 }, stats:{ ...initialState.stats, fatigue:50, stress:40 } };
    const gifted = reducer(state,{ type:'BUY_SEASON_SHOP_OFFER', offerId:'gift_bundle' });
    expect(gifted.inventory.star_cookie).toBe(state.inventory.star_cookie + 1);
    expect(gifted.inventory.herb_tea).toBe(state.inventory.herb_tea + 1);
    const recovered = reducer(gifted,{ type:'BUY_SEASON_SHOP_OFFER', offerId:'recovery_kit' });
    expect(recovered.stats.fatigue).toBe(30);
    expect(recovered.stats.stress).toBe(30);
  });

  it('preserves shop purchase history across ordinary actions and resets it on RESET', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, seasonShopPurchases:[`${key}:season_keepsake:1`] };
    const moved = reducer(state,{ type:'GO', screen:'schedule' });
    expect(moved.seasonShopPurchases).toEqual(state.seasonShopPurchases);
    expect(reducer(moved,{ type:'RESET' }).seasonShopPurchases).toEqual([]);
  });

  it('preserves seasonal history-ready scores across month changes', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, screen:'result' as const, seasonJourneyScores:{ [key]:200 }, seasonTokenBalances:{ [key]:33 } };
    const next = reducer(state,{ type:'NEXT_MONTH' });
    expect(next.seasonJourneyScores[key]).toBeGreaterThanOrEqual(200);
    expect(next.seasonTokenBalances[key]).toBeGreaterThanOrEqual(33);
  });
});
