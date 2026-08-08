import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer } from './game';
import { seasonJourneyKey } from './season-journey';

const complete = (key:'1-spring'|'1-summer'|'1-autumn'|'1-winter') => ({ key, score:1300, tiersCompleted:10, tokensEarned:120 });

describe('season mastery reward progression', () => {
  it('hydrates only valid claimed mastery reward ranks', () => {
    const hydrated = hydrateGameState({
      ...initialState,
      claimedSeasonMasteryRanks:['traveler','bad','traveler','eternal'],
    });
    expect(hydrated.claimedSeasonMasteryRanks).toEqual(['traveler','eternal']);
  });

  it('grants traveler reward when a keepsake purchase crosses score 5', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const ready = {
      ...initialState,
      seasonJourneyHistory:[complete('1-spring')],
      seasonShopPurchases:['1-summer:seasonal_keepsake:1'],
      claimedSeasonKeepsakeMilestones:['first_keepsake'] as ('first_keepsake')[],
      seasonTokenBalances:{ [key]:80 },
    };
    const next = reducer(ready,{ type:'PURCHASE_SEASON_OFFER', offerId:'seasonal_keepsake' });
    expect(next.claimedSeasonMasteryRanks).toEqual(['traveler']);
    expect(next.gold).toBe(ready.gold + 200);
  });

  it('grants only the newly crossed chronicler reward on season completion', () => {
    const winterClaims = Array.from({ length:10 },(_,index) => `1-winter:${index + 1}`);
    const ready = {
      ...initialState,
      screen:'result' as const,
      month:2,
      seasonJourneyHistory:[complete('1-spring')],
      seasonJourneyScores:{ '1-winter':1300 },
      claimedSeasonJourneyTiers:winterClaims,
      seasonTokenBalances:{ '1-winter':120 },
      seasonShopPurchases:[
        '1-spring:seasonal_keepsake:1',
        '1-summer:seasonal_keepsake:1',
        '1-autumn:seasonal_keepsake:1',
        '1-winter:seasonal_keepsake:1',
      ],
      claimedSeasonKeepsakeMilestones:['first_keepsake','four_seasons'] as ('first_keepsake'|'four_seasons')[],
      claimedSeasonCompletionHonors:['first_complete'] as ('first_complete')[],
      claimedSeasonMasteryRanks:['traveler'] as ('traveler')[],
    };
    const next = reducer(ready,{ type:'NEXT_MONTH' });
    expect(next.claimedSeasonMasteryRanks).toEqual(['traveler','chronicler']);
    expect(next.gems).toBeGreaterThanOrEqual(ready.gems + 1);
  });
});
