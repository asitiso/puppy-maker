export * from './game-live-base';

import * as Base from './game-base';
import * as Live from './game-live-base';
import {
  journeyTierClaimKey,
  newlyEarnedJourneyTiers,
  seasonJourneyKey,
} from './season-journey';
import {
  canPurchaseSeasonOffer,
  seasonShopOffer,
  seasonShopPurchaseCount,
  seasonShopPurchaseKey,
  type SeasonShopOfferId,
} from './season-shop';
import {
  advanceWeeklyDirectives,
  weeklyDirectiveKey,
  weeklyDirectives,
} from './weekly-directives';

export type Action = Live.Action | { type:'BUY_SEASON_SHOP_OFFER'; offerId:SeasonShopOfferId };

function buySeasonShopOffer(state:Live.GameState, offerId:SeasonShopOfferId):Live.GameState {
  const offer = seasonShopOffer(offerId);
  if (!offer) return state;
  const key = seasonJourneyKey(state.year,state.month);
  const balance = state.seasonTokenBalances[key] ?? 0;
  const count = seasonShopPurchaseCount(state.seasonShopPurchases,key,offer.id);
  if (!canPurchaseSeasonOffer(offer,balance,count)) return state;
  const inventory = { ...state.inventory };
  let gold = state.gold;
  let gems = state.gems;
  let stats = state.stats;
  if ('gold' in offer.reward) gold += offer.reward.gold;
  if ('gems' in offer.reward) gems += offer.reward.gems;
  if ('giftItems' in offer.reward) {
    inventory.star_cookie += 1;
    inventory.herb_tea += Math.max(0,offer.reward.giftItems - 1);
  }
  if ('recoveryItems' in offer.reward) {
    const strength = Math.max(1,offer.reward.recoveryItems);
    stats = {
      ...stats,
      fatigue:Math.max(0,stats.fatigue - 10 * strength),
      stress:Math.max(0,stats.stress - 5 * strength),
    };
  }
  return {
    ...state,
    gold,
    gems,
    stats,
    inventory,
    seasonTokenBalances:{ ...state.seasonTokenBalances, [key]:balance - offer.cost },
    seasonShopPurchases:[...state.seasonShopPurchases,seasonShopPurchaseKey(key,offer.id,count + 1)],
  };
}

export function reducer(state:Live.GameState, action:Action):Live.GameState {
  if (action.type === 'BUY_SEASON_SHOP_OFFER') return buySeasonShopOffer(state,action.offerId);

  if (action.type !== 'FINISH_TRAINING') {
    const next = Live.reducer(state,action);
    if (next === state) return state;
    return { ...next, seasonShopPurchases:state.seasonShopPurchases };
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next:Live.GameState = { ...state, ...baseNext };
  const weekKey = weeklyDirectiveKey(state.year,state.month,state.week);
  const directives = weeklyDirectives(state.year,state.month,state.week);
  const progress = state.weeklyDirectiveKey === weekKey ? state.weeklyDirectiveProgress : {};
  const weekly = advanceWeeklyDirectives(
    directives,
    progress,
    { kind:'training' },
    state.rewardedWeeklyDirectives,
    weekKey,
  );
  const journeyKey = seasonJourneyKey(state.year,state.month);
  const previousScore = state.seasonJourneyScores[journeyKey] ?? 0;
  const nextScore = previousScore + weekly.reward.journeyPoints;
  const earnedTiers = newlyEarnedJourneyTiers(previousScore,nextScore,state.claimedSeasonJourneyTiers,journeyKey);
  const claims = [...state.claimedSeasonJourneyTiers];
  const rewardedWeekly = [...state.rewardedWeeklyDirectives];
  let gold = 0;
  let gems = 0;
  let tierTokens = 0;
  for (const tier of earnedTiers) {
    claims.push(journeyTierClaimKey(journeyKey,tier.tier));
    gold += tier.reward.gold;
    gems += tier.reward.gems;
    tierTokens += tier.reward.tokens;
  }
  for (const directive of weekly.completed) {
    const rewardKey = `${weekKey}:${directive.id}`;
    if (!rewardedWeekly.includes(rewardKey)) rewardedWeekly.push(rewardKey);
  }
  const tokensEarned = tierTokens + weekly.reward.tokens;
  return {
    ...next,
    seasonJourneyScores:{ ...state.seasonJourneyScores, [journeyKey]:nextScore },
    claimedSeasonJourneyTiers:claims,
    seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:(state.seasonTokenBalances[journeyKey] ?? 0) + tokensEarned },
    weeklyDirectiveKey:weekKey,
    weeklyDirectiveProgress:weekly.progress,
    rewardedWeeklyDirectives:rewardedWeekly,
    seasonShopPurchases:state.seasonShopPurchases,
    seasonJourneyHistory:state.seasonJourneyHistory,
    gold:next.gold + gold,
    gems:next.gems + gems,
    lastLiveOpsProgress:{
      journeyPoints:weekly.reward.journeyPoints,
      seasonTiersClaimed:earnedTiers.map(tier => tier.tier),
      weeklyCompleted:weekly.completed.map(item => item.id),
      tokensEarned,
    },
  };
}
