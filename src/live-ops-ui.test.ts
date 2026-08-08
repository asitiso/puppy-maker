import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { liveOpsUiSummary } from './live-ops-ui';
import { seasonJourneyKey } from './season-journey';

describe('live ops ui summary', () => {
  it('summarizes current journey, directives, shop and archive', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const summary = liveOpsUiSummary({
      ...initialState,
      seasonJourneyScores:{ [key]:88 },
      seasonTokenBalances:{ [key]:45 },
      weeklyDirectiveKey:'1-4-1',
      weeklyDirectiveProgress:{ steady_training:1 },
      seasonShopPurchases:[`${key}:gold_pouch:1`],
      seasonJourneyHistory:[{ key:'1-winter', score:625, tiersCompleted:7, tokensEarned:90 }],
    });
    expect(summary.season.key).toBe(key);
    expect(summary.season.score).toBe(88);
    expect(summary.season.tokens).toBe(45);
    expect(summary.season.nextTier).toEqual(expect.objectContaining({ tier:2, threshold:100 }));
    expect(summary.directives).toHaveLength(3);
    expect(summary.shop.find(item => item.id === 'gold_pouch')).toEqual(expect.objectContaining({ purchased:1, remaining:1, canBuy:true }));
    expect(summary.archive[0]).toEqual(expect.objectContaining({ key:'1-winter', rank:'별빛' }));
  });

  it('reports a completed journey with no next tier', () => {
    const key = seasonJourneyKey(initialState.year,initialState.month);
    const summary = liveOpsUiSummary({ ...initialState, seasonJourneyScores:{ [key]:1300 } });
    expect(summary.season.nextTier).toBeNull();
    expect(summary.season.progressPercent).toBe(100);
  });

  it('summarizes keepsake collection and next long-term milestone', () => {
    const summary = liveOpsUiSummary({
      ...initialState,
      seasonShopPurchases:[
        '1-spring:seasonal_keepsake:1',
        '1-summer:seasonal_keepsake:1',
        '1-autumn:seasonal_keepsake:1',
      ],
      claimedSeasonKeepsakeMilestones:['first_keepsake'],
    });
    expect(summary.keepsakes).toEqual(expect.objectContaining({
      total:3,
      seasons:{ spring:1, summer:1, autumn:1, winter:0 },
      claimed:['first_keepsake'],
    }));
    expect(summary.keepsakes.nextMilestone).toEqual(expect.objectContaining({ id:'four_seasons', threshold:4 }));
  });

  it('summarizes season completion honors and meta progress', () => {
    const summary = liveOpsUiSummary({
      ...initialState,
      seasonJourneyHistory:[
        { key:'1-spring', score:1300, tiersCompleted:10, tokensEarned:120 },
        { key:'1-summer', score:1300, tiersCompleted:10, tokensEarned:120 },
      ],
      claimedSeasonCompletionHonors:['first_complete'],
    });
    expect(summary.honors.progress).toEqual({
      completedSeasons:2,
      completedSeasonTypes:2,
      perfectYears:0,
    });
    expect(summary.honors.items.find(item => item.id === 'first_complete')).toEqual(expect.objectContaining({ claimed:true }));
    expect(summary.honors.items.find(item => item.id === 'four_seasons')).toEqual(expect.objectContaining({ claimed:false, current:2, threshold:4 }));
  });

  it('combines long-term seasonal progress into a mastery rank', () => {
    const summary = liveOpsUiSummary({
      ...initialState,
      seasonJourneyHistory:[
        { key:'1-spring', score:1300, tiersCompleted:10, tokensEarned:120 },
        { key:'1-summer', score:1300, tiersCompleted:10, tokensEarned:120 },
      ],
      seasonShopPurchases:[
        '1-spring:seasonal_keepsake:1',
        '1-summer:seasonal_keepsake:1',
        '1-autumn:seasonal_keepsake:1',
      ],
      claimedSeasonCompletionHonors:['first_complete'],
    });
    expect(summary.mastery).toEqual(expect.objectContaining({ id:'chronicler', score:13, nextThreshold:24 }));
  });
});
