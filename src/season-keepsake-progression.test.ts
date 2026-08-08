import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';

describe('season keepsake milestone progression', () => {
  it('hydrates only valid claimed keepsake milestones', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedSeasonKeepsakeMilestones:['first_keepsake','bad','first_keepsake','eight_seasons'],
    });
    expect(hydrated.claimedSeasonKeepsakeMilestones).toEqual(['first_keepsake','eight_seasons']);
  });

  it('rewards the first keepsake exactly once', () => {
    const key = seasonJourneyKey(1,1);
    const ready = { ...initialState, year:1, month:1, seasonTokenBalances:{ [key]:80 } };
    const next = reducer(ready,{ type:'PURCHASE_SEASON_OFFER', offerId:'seasonal_keepsake' });
    expect(next.gold).toBe(ready.gold + 200);
    expect(next.claimedSeasonKeepsakeMilestones).toEqual(['first_keepsake']);
    expect(reducer(next,{ type:'PURCHASE_SEASON_OFFER', offerId:'seasonal_keepsake' })).toBe(next);
  });

  it('rewards a complete four-season keepsake set', () => {
    const key = seasonJourneyKey(1,12);
    const ready = {
      ...initialState,
      year:1,
      month:12,
      seasonTokenBalances:{ [key]:80 },
      seasonShopPurchases:[
        '1-spring:seasonal_keepsake:1',
        '1-summer:seasonal_keepsake:1',
        '1-autumn:seasonal_keepsake:1',
      ],
      claimedSeasonKeepsakeMilestones:['first_keepsake'] as const,
    };
    const next = reducer(ready,{ type:'PURCHASE_SEASON_OFFER', offerId:'seasonal_keepsake' });
    expect(next.gems).toBe(ready.gems + 2);
    expect(next.claimedSeasonKeepsakeMilestones).toEqual(['first_keepsake','four_seasons']);
  });
});
