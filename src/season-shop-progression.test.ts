import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';

describe('season shop progression', () => {
  it('hydrates legacy saves with an empty sanitized purchase ledger', () => {
    const hydrated = hydrateGameState({ ...initialState, seasonShopPurchases:['bad','1-spring:gold_pouch:1','1-spring:gold_pouch:1'] });
    expect(hydrated.seasonShopPurchases).toEqual(['1-spring:gold_pouch:1']);
  });

  it('spends current-season tokens and grants a gold pouch', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const state = { ...initialState, seasonTokenBalances:{ [key]:40 } };
    const next = reducer(state,{ type:'PURCHASE_SEASON_OFFER', offerId:'gold_pouch' });
    expect(next.seasonTokenBalances[key]).toBe(20);
    expect(next.gold).toBe(state.gold + 300);
    expect(next.seasonShopPurchases).toEqual([`${key}:gold_pouch:1`]);
  });

  it('grants inventory and expedition materials from utility offers', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const ready = { ...initialState, seasonTokenBalances:{ [key]:100 } };
    const recovery = reducer(ready,{ type:'PURCHASE_SEASON_OFFER', offerId:'recovery_bundle' });
    expect(recovery.inventory.herb_tea).toBe(ready.inventory.herb_tea + 1);
    expect(recovery.inventory.star_cookie).toBe(ready.inventory.star_cookie + 1);
    const cache = reducer(recovery,{ type:'PURCHASE_SEASON_OFFER', offerId:'expedition_cache' });
    expect(cache.expeditionMaterials).toEqual({ star_bark:3, arcane_shard:3, wind_pearl:3 });
  });

  it('returns the identical state when purchase is unaffordable or exhausted', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const poor = { ...initialState, seasonTokenBalances:{ [key]:19 } };
    expect(reducer(poor,{ type:'PURCHASE_SEASON_OFFER', offerId:'gold_pouch' })).toBe(poor);
    const exhausted = {
      ...initialState,
      seasonTokenBalances:{ [key]:99 },
      seasonShopPurchases:[`${key}:gold_pouch:1`,`${key}:gold_pouch:2`],
    };
    expect(reducer(exhausted,{ type:'PURCHASE_SEASON_OFFER', offerId:'gold_pouch' })).toBe(exhausted);
  });
});
