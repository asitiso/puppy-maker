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
});
