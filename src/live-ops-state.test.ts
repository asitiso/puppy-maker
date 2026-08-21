import { describe, expect, it } from 'vitest';
import { emptyLiveOpsState, hydrateLiveOpsState } from './live-ops-state';

describe('live ops persistent state', () => {
  it('starts with empty journey, token, weekly, archive, shop, and keepsake state', () => {
    expect(emptyLiveOpsState()).toEqual({
      seasonJourneyScores:{},
      claimedSeasonJourneyTiers:[],
      seasonTokenBalances:{},
      weeklyDirectiveKey:null,
      weeklyDirectiveProgress:{},
      rewardedWeeklyDirectives:[],
      seasonJourneyHistory:[],
      seasonShopPurchases:[],
      claimedSeasonKeepsakeMilestones:[],
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
      seasonJourneyHistory:[
        { key:'1-spring', score:500.8, tiersCompleted:5.7, tokensEarned:44.9 },
        { key:'bad', score:999, tiersCompleted:99, tokensEarned:-1 },
      ],
      seasonShopPurchases:['1-spring:gold_pouch:1','bad','1-spring:gold_pouch:1','1-spring:seasonal_keepsake:2'],
      claimedSeasonKeepsakeMilestones:['first_keepsake','bad','first_keepsake','eight_seasons'],
    })).toEqual({
      seasonJourneyScores:{ '1-spring':88 },
      claimedSeasonJourneyTiers:['1-spring:1'],
      seasonTokenBalances:{ '1-spring':12 },
      weeklyDirectiveKey:'1-4-2',
      weeklyDirectiveProgress:{ steady_training:2 },
      rewardedWeeklyDirectives:['1-4-2:steady_training'],
      seasonJourneyHistory:[{ key:'1-spring', score:500, tiersCompleted:5, tokensEarned:44 }],
      seasonShopPurchases:['1-spring:gold_pouch:1'],
      claimedSeasonKeepsakeMilestones:['first_keepsake','eight_seasons'],
    });
  });

  it('rejects impossible weekly years and retired directive ids during hydration', () => {
    const hydrated = hydrateLiveOpsState({
      weeklyDirectiveKey:'0-4-2',
      weeklyDirectiveProgress:{ steady_training:2, retired_directive:99 },
      rewardedWeeklyDirectives:[
        '0-4-2:steady_training',
        '1-4-2:retired_directive',
        '1-4-2:steady_training',
      ],
    });
    expect(hydrated.weeklyDirectiveKey).toBeNull();
    expect(hydrated.weeklyDirectiveProgress).toEqual({ steady_training:2 });
    expect(hydrated.rewardedWeeklyDirectives).toEqual(['1-4-2:steady_training']);
  });
});
