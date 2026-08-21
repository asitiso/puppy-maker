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
      weeklyDirectiveProgress:{ guardian_sortie:2.9, bad:-3 },
      rewardedWeeklyDirectives:['1-4-2:guardian_sortie','bad','1-4-2:guardian_sortie'],
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
      weeklyDirectiveProgress:{ guardian_sortie:2 },
      rewardedWeeklyDirectives:['1-4-2:guardian_sortie'],
      seasonJourneyHistory:[{ key:'1-spring', score:500, tiersCompleted:5, tokensEarned:44 }],
      seasonShopPurchases:['1-spring:gold_pouch:1'],
      claimedSeasonKeepsakeMilestones:['first_keepsake','eight_seasons'],
    });
  });

  it('drops valid but stale directive progress that is not assigned to the hydrated week', () => {
    const hydrated = hydrateLiveOpsState({
      weeklyDirectiveKey:'1-4-2',
      weeklyDirectiveProgress:{ guardian_sortie:1, steady_training:2 },
    });
    expect(hydrated.weeklyDirectiveProgress).toEqual({ guardian_sortie:1 });
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

  it('rejects impossible season year zero across scores, tokens, tiers, and history', () => {
    const hydrated = hydrateLiveOpsState({
      seasonJourneyScores:{ '0-spring':999, '1-spring':88 },
      claimedSeasonJourneyTiers:['0-spring:10','1-spring:1'],
      seasonTokenBalances:{ '0-spring':999, '1-spring':12 },
      seasonJourneyHistory:[
        { key:'0-spring', score:999, tiersCompleted:10, tokensEarned:999 },
        { key:'1-spring', score:88, tiersCompleted:1, tokensEarned:12 },
      ],
    });
    expect(hydrated.seasonJourneyScores).toEqual({ '1-spring':88 });
    expect(hydrated.claimedSeasonJourneyTiers).toEqual(['1-spring:1']);
    expect(hydrated.seasonTokenBalances).toEqual({ '1-spring':12 });
    expect(hydrated.seasonJourneyHistory).toEqual([
      { key:'1-spring', score:88, tiersCompleted:1, tokensEarned:12 },
    ]);
  });
});
