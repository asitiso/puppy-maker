import { describe, expect, it } from 'vitest';
import { emptyLiveOpsState, hydrateLiveOpsState } from './live-ops-state';

describe('live ops persistent state', () => {
  it('starts with empty journey, token, weekly, shop, and archive state', () => {
    expect(emptyLiveOpsState()).toEqual({
      seasonJourneyScores:{},
      claimedSeasonJourneyTiers:[],
      seasonTokenBalances:{},
      weeklyDirectiveKey:null,
      weeklyDirectiveProgress:{},
      rewardedWeeklyDirectives:[],
      seasonShopPurchases:[],
      seasonJourneyHistory:[],
    });
  });

  it('sanitizes malformed stored live ops values', () => {
    expect(hydrateLiveOpsState({
      seasonJourneyScores:{ '1-spring':88.9, bad:-4 },
      claimedSeasonJourneyTiers:['1-spring:1','bad','1-spring:1'],
      seasonTokenBalances:{ '1-spring':12.7, nope:-2 },
      weeklyDirectiveKey:'1-4-2',
      weeklyDirectiveProgress:{ steady_training:2.9, bad:-3 },
      rewardedWeeklyDirectives:['1-4-2:steady_training','bad','1-4-2:steady_training'],
      seasonShopPurchases:[
        '1-spring:gem_pouch:1','1-spring:gem_pouch:1','1-spring:gem_pouch:2','1-spring:gem_pouch:3',
        '1-spring:season_keepsake:1','1-spring:season_keepsake:2','bad',
      ],
      seasonJourneyHistory:[
        { key:'1-spring', score:500.8, tiersCompleted:5.7, tokensEarned:44.9 },
        { key:'bad', score:999, tiersCompleted:99, tokensEarned:-1 },
      ],
    })).toEqual({
      seasonJourneyScores:{ '1-spring':88 },
      claimedSeasonJourneyTiers:['1-spring:1'],
      seasonTokenBalances:{ '1-spring':12 },
      weeklyDirectiveKey:'1-4-2',
      weeklyDirectiveProgress:{ steady_training:2 },
      rewardedWeeklyDirectives:['1-4-2:steady_training'],
      seasonShopPurchases:['1-spring:gem_pouch:1','1-spring:gem_pouch:2','1-spring:season_keepsake:1'],
      seasonJourneyHistory:[{ key:'1-spring', score:500, tiersCompleted:5, tokensEarned:44 }],
    });
  });
});
