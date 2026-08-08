export * from './game-live-base';

import * as Base from './game-base';
import * as Live from './game-live-base';
import {
  journeyTierClaimKey,
  newlyEarnedJourneyTiers,
  seasonJourneyKey,
} from './season-journey';
import {
  advanceWeeklyDirectives,
  weeklyDirectiveKey,
  weeklyDirectives,
} from './weekly-directives';
import { resolveSeasonPurchase, type SeasonShopOfferId } from './season-shop';
import { newlyEarnedKeepsakeMilestones } from './season-keepsakes';
import {
  newlyEarnedSeasonHonors,
  type SeasonCompletionHonorId,
} from './season-completion-honors';

export type GameState = Live.GameState & {
  claimedSeasonCompletionHonors:SeasonCompletionHonorId[];
};

export type Action = Live.Action | { type:'PURCHASE_SEASON_OFFER'; offerId:SeasonShopOfferId };

export const initialState:GameState = {
  ...Live.initialState,
  claimedSeasonCompletionHonors:[],
};

const honorIds:SeasonCompletionHonorId[] = ['first_complete','four_seasons','perfect_year','eight_complete'];
const isRecord = (value:unknown): value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function hydrateSeasonCompletionHonors(raw:unknown):SeasonCompletionHonorId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonCompletionHonorId => typeof value === 'string' && honorIds.includes(value as SeasonCompletionHonorId)))];
}

export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Live.hydrateGameState(raw),
    claimedSeasonCompletionHonors:hydrateSeasonCompletionHonors(source.claimedSeasonCompletionHonors),
  };
}

function preserveSeasonMeta(state:GameState, next:Live.GameState):GameState {
  if (next === state) return state;
  return {
    ...next,
    claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [],
  };
}

function applySeasonCompletionHonors(previous:GameState, next:GameState):GameState {
  const claimed = previous.claimedSeasonCompletionHonors ?? [];
  const earned = newlyEarnedSeasonHonors(next.seasonJourneyHistory,claimed);
  if (!earned.length) return next;
  return {
    ...next,
    gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0),
    gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0),
    claimedSeasonCompletionHonors:[...claimed,...earned.map(item => item.id)],
  };
}

export function reducer(state:GameState, action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'PURCHASE_SEASON_OFFER') {
    const journeyKey = seasonJourneyKey(state.year,state.month);
    const result = resolveSeasonPurchase({
      seasonKey:journeyKey,
      offerId:action.offerId,
      tokens:state.seasonTokenBalances[journeyKey] ?? 0,
      purchaseKeys:state.seasonShopPurchases,
    });
    if (!result.accepted) return state;
    const inventory = { ...state.inventory };
    for (const [id,amount] of Object.entries(result.reward.inventory)) {
      const key = id as keyof typeof inventory;
      inventory[key] += amount ?? 0;
    }
    const expeditionMaterials = { ...state.expeditionMaterials };
    for (const [id,amount] of Object.entries(result.reward.materials)) {
      const key = id as keyof typeof expeditionMaterials;
      expeditionMaterials[key] += amount ?? 0;
    }
    const seasonShopPurchases = [...state.seasonShopPurchases,result.purchaseKey];
    const claimedMilestones = state.claimedSeasonKeepsakeMilestones ?? [];
    const keepsakeMilestones = newlyEarnedKeepsakeMilestones(seasonShopPurchases,claimedMilestones);
    const keepsakeGold = keepsakeMilestones.reduce((sum,item) => sum + item.reward.gold,0);
    const keepsakeGems = keepsakeMilestones.reduce((sum,item) => sum + item.reward.gems,0);
    return {
      ...state,
      gold:state.gold + result.reward.gold + keepsakeGold,
      gems:state.gems + keepsakeGems,
      inventory,
      expeditionMaterials,
      seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:result.tokens },
      seasonShopPurchases,
      claimedSeasonKeepsakeMilestones:[...claimedMilestones,...keepsakeMilestones.map(item => item.id)],
    };
  }

  if (action.type !== 'FINISH_TRAINING') {
    const liveNext = Live.reducer(state,action);
    if (liveNext === state) return state;
    const preserved = preserveSeasonMeta(state,liveNext);
    return action.type === 'NEXT_MONTH' ? applySeasonCompletionHonors(state,preserved) : preserved;
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next:GameState = {
    ...state,
    ...baseNext,
    claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [],
  };
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
    seasonJourneyHistory:state.seasonJourneyHistory,
    seasonShopPurchases:state.seasonShopPurchases,
    claimedSeasonKeepsakeMilestones:state.claimedSeasonKeepsakeMilestones ?? [],
    claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [],
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
