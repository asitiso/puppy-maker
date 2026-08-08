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
import { newlyEarnedKeepsakeMilestones, seasonKeepsakeCollection } from './season-keepsakes';
import {
  newlyEarnedSeasonHonors,
  type SeasonCompletionHonorId,
} from './season-completion-honors';
import { seasonMasteryScore } from './season-mastery-rank';
import {
  newlyEarnedSeasonMasteryRewards,
  type SeasonMasteryRewardRank,
} from './season-mastery-rewards';
import {
  resolveSeasonLegacyUnlock,
  seasonLegacyNodes,
  type SeasonLegacyNodeId,
} from './season-legacy-board';
import { seasonLegacyEffects } from './season-legacy-effects';

export type GameState = Live.GameState & {
  claimedSeasonCompletionHonors:SeasonCompletionHonorId[];
  claimedSeasonMasteryRanks:SeasonMasteryRewardRank[];
  unlockedSeasonLegacyNodes:SeasonLegacyNodeId[];
};

export type Action = Live.Action
  | { type:'PURCHASE_SEASON_OFFER'; offerId:SeasonShopOfferId }
  | { type:'UNLOCK_SEASON_LEGACY_NODE'; nodeId:SeasonLegacyNodeId };

export const initialState:GameState = {
  ...Live.initialState,
  claimedSeasonCompletionHonors:[],
  claimedSeasonMasteryRanks:[],
  unlockedSeasonLegacyNodes:[],
};

const honorIds:SeasonCompletionHonorId[] = ['first_complete','four_seasons','perfect_year','eight_complete'];
const masteryRewardRanks:SeasonMasteryRewardRank[] = ['traveler','chronicler','guardian','eternal'];
const legacyNodeIds = seasonLegacyNodes.map(node => node.id);
const isRecord = (value:unknown): value is Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function hydrateSeasonCompletionHonors(raw:unknown):SeasonCompletionHonorId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonCompletionHonorId => typeof value === 'string' && honorIds.includes(value as SeasonCompletionHonorId)))];
}
function hydrateSeasonMasteryRanks(raw:unknown):SeasonMasteryRewardRank[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonMasteryRewardRank => typeof value === 'string' && masteryRewardRanks.includes(value as SeasonMasteryRewardRank)))];
}
function hydrateSeasonLegacyNodes(raw:unknown):SeasonLegacyNodeId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((value):value is SeasonLegacyNodeId => typeof value === 'string' && legacyNodeIds.includes(value as SeasonLegacyNodeId)))];
}
export function hydrateGameState(raw:unknown):GameState {
  const source = isRecord(raw) ? raw : {};
  return {
    ...Live.hydrateGameState(raw),
    claimedSeasonCompletionHonors:hydrateSeasonCompletionHonors(source.claimedSeasonCompletionHonors),
    claimedSeasonMasteryRanks:hydrateSeasonMasteryRanks(source.claimedSeasonMasteryRanks),
    unlockedSeasonLegacyNodes:hydrateSeasonLegacyNodes(source.unlockedSeasonLegacyNodes),
  };
}
function preserveSeasonMeta(state:GameState, next:Live.GameState):GameState {
  if (next === state) return state;
  return { ...next, claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [], claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [], unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [] };
}
function applySeasonCompletionHonors(previous:GameState, next:GameState):GameState {
  const claimed = previous.claimedSeasonCompletionHonors ?? [];
  const earned = newlyEarnedSeasonHonors(next.seasonJourneyHistory,claimed);
  if (!earned.length) return next;
  return { ...next, gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0), gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0), claimedSeasonCompletionHonors:[...claimed,...earned.map(item => item.id)] };
}
function applySeasonMasteryRewards(previous:GameState, next:GameState):GameState {
  const claimed = previous.claimedSeasonMasteryRanks ?? [];
  const keepsakes = seasonKeepsakeCollection(next.seasonShopPurchases).total;
  const completedSeasons = next.seasonJourneyHistory.filter(entry => entry.tiersCompleted >= 10).length;
  const honors = next.claimedSeasonCompletionHonors.length;
  const score = seasonMasteryScore({ completedSeasons, keepsakes, honors });
  const earned = newlyEarnedSeasonMasteryRewards(score,claimed);
  if (!earned.length) return { ...next, claimedSeasonMasteryRanks:claimed };
  return { ...next, gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0), gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0), claimedSeasonMasteryRanks:[...claimed,...earned.map(item => item.rank)] };
}
function applyAutomaticLegacyUnlocks(state:GameState):GameState {
  let next = state;
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of seasonLegacyNodes) {
      const result = resolveSeasonLegacyUnlock({ nodeId:node.id, history:next.seasonJourneyHistory, honors:next.claimedSeasonCompletionHonors, unlocked:next.unlockedSeasonLegacyNodes ?? [] });
      if (!result.accepted) continue;
      next = { ...next, gold:next.gold + result.reward.gold, gems:next.gems + result.reward.gems, unlockedSeasonLegacyNodes:result.unlocked };
      changed = true;
      break;
    }
  }
  return next;
}
function applyLegacyJourneyBonus(state:GameState, key:ReturnType<typeof seasonJourneyKey>, bonus:number):GameState {
  if (bonus <= 0) return state;
  const previousScore = state.seasonJourneyScores[key] ?? 0;
  const nextScore = previousScore + bonus;
  const earnedTiers = newlyEarnedJourneyTiers(previousScore,nextScore,state.claimedSeasonJourneyTiers,key);
  const claimedSeasonJourneyTiers = [...state.claimedSeasonJourneyTiers];
  let gold = 0, gems = 0, tierTokens = 0;
  for (const tier of earnedTiers) { claimedSeasonJourneyTiers.push(journeyTierClaimKey(key,tier.tier)); gold += tier.reward.gold; gems += tier.reward.gems; tierTokens += tier.reward.tokens; }
  const seasonTokenBalances = { ...state.seasonTokenBalances, [key]:(state.seasonTokenBalances[key] ?? 0) + tierTokens };
  const seasonJourneyHistory = state.seasonJourneyHistory.map(entry => entry.key === key ? { ...entry, score:nextScore, tiersCompleted:claimedSeasonJourneyTiers.filter(claim => claim.startsWith(`${key}:`)).length, tokensEarned:seasonTokenBalances[key] } : entry);
  return { ...state, seasonJourneyScores:{ ...state.seasonJourneyScores, [key]:nextScore }, claimedSeasonJourneyTiers, seasonTokenBalances, seasonJourneyHistory, gold:state.gold + gold, gems:state.gems + gems, lastLiveOpsProgress:state.lastLiveOpsProgress ? { ...state.lastLiveOpsProgress, journeyPoints:state.lastLiveOpsProgress.journeyPoints + bonus, seasonTiersClaimed:[...state.lastLiveOpsProgress.seasonTiersClaimed,...earnedTiers.map(tier => tier.tier)], tokensEarned:state.lastLiveOpsProgress.tokensEarned + tierTokens } : state.lastLiveOpsProgress };
}
export function reducer(state:GameState, action:Action):GameState {
  if (action.type === 'RESET') return initialState;
  if (action.type === 'UNLOCK_SEASON_LEGACY_NODE') {
    const result = resolveSeasonLegacyUnlock({ nodeId:action.nodeId, history:state.seasonJourneyHistory, honors:state.claimedSeasonCompletionHonors, unlocked:state.unlockedSeasonLegacyNodes ?? [] });
    if (!result.accepted) return state;
    return { ...state, gold:state.gold + result.reward.gold, gems:state.gems + result.reward.gems, unlockedSeasonLegacyNodes:result.unlocked };
  }
  if (action.type === 'PURCHASE_SEASON_OFFER') {
    const journeyKey = seasonJourneyKey(state.year,state.month);
    const result = resolveSeasonPurchase({ seasonKey:journeyKey, offerId:action.offerId, tokens:state.seasonTokenBalances[journeyKey] ?? 0, purchaseKeys:state.seasonShopPurchases });
    if (!result.accepted) return state;
    const inventory = { ...state.inventory };
    for (const [id,amount] of Object.entries(result.reward.inventory)) { const key = id as keyof typeof inventory; inventory[key] += amount ?? 0; }
    const expeditionMaterials = { ...state.expeditionMaterials };
    for (const [id,amount] of Object.entries(result.reward.materials)) { const key = id as keyof typeof expeditionMaterials; expeditionMaterials[key] += amount ?? 0; }
    const seasonShopPurchases = [...state.seasonShopPurchases,result.purchaseKey];
    const claimedMilestones = state.claimedSeasonKeepsakeMilestones ?? [];
    const keepsakeMilestones = newlyEarnedKeepsakeMilestones(seasonShopPurchases,claimedMilestones);
    const purchased:GameState = { ...state, gold:state.gold + result.reward.gold + keepsakeMilestones.reduce((sum,item) => sum + item.reward.gold,0), gems:state.gems + keepsakeMilestones.reduce((sum,item) => sum + item.reward.gems,0), inventory, expeditionMaterials, seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:result.tokens }, seasonShopPurchases, claimedSeasonKeepsakeMilestones:[...claimedMilestones,...keepsakeMilestones.map(item => item.id)], claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [], unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [] };
    return applyAutomaticLegacyUnlocks(applySeasonMasteryRewards(state,purchased));
  }
  if (action.type !== 'FINISH_TRAINING') {
    const liveNext = Live.reducer(state,action);
    if (liveNext === state) return state;
    let preserved = preserveSeasonMeta(state,liveNext);
    const legacy = seasonLegacyEffects(state.unlockedSeasonLegacyNodes ?? []);
    const journeyKey = seasonJourneyKey(state.year,state.month);
    if (action.type === 'FINISH_EXPEDITION_STAGE') return applyLegacyJourneyBonus(preserved,journeyKey,legacy.expeditionJourneyBonus);
    if (action.type !== 'NEXT_MONTH') return preserved;
    preserved = applyLegacyJourneyBonus(preserved,journeyKey,legacy.monthlyJourneyBonus);
    const honored = applySeasonCompletionHonors(state,preserved);
    return applyAutomaticLegacyUnlocks(applySeasonMasteryRewards(state,honored));
  }
  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const next:GameState = { ...state, ...baseNext, claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [], claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [], unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [] };
  const weekKey = weeklyDirectiveKey(state.year,state.month,state.week);
  const directives = weeklyDirectives(state.year,state.month,state.week);
  const progress = state.weeklyDirectiveKey === weekKey ? state.weeklyDirectiveProgress : {};
  const weekly = advanceWeeklyDirectives(directives,progress,{ kind:'training' },state.rewardedWeeklyDirectives,weekKey);
  const journeyKey = seasonJourneyKey(state.year,state.month);
  const previousScore = state.seasonJourneyScores[journeyKey] ?? 0;
  const nextScore = previousScore + weekly.reward.journeyPoints;
  const earnedTiers = newlyEarnedJourneyTiers(previousScore,nextScore,state.claimedSeasonJourneyTiers,journeyKey);
  const claims = [...state.claimedSeasonJourneyTiers], rewardedWeekly = [...state.rewardedWeeklyDirectives];
  let gold = 0, gems = 0, tierTokens = 0;
  for (const tier of earnedTiers) { claims.push(journeyTierClaimKey(journeyKey,tier.tier)); gold += tier.reward.gold; gems += tier.reward.gems; tierTokens += tier.reward.tokens; }
  for (const directive of weekly.completed) { const rewardKey = `${weekKey}:${directive.id}`; if (!rewardedWeekly.includes(rewardKey)) rewardedWeekly.push(rewardKey); }
  const legacy = seasonLegacyEffects(state.unlockedSeasonLegacyNodes ?? []);
  const legacyTokens = weekly.completed.length > 0 ? legacy.weeklyTokenBonus * weekly.completed.length : 0;
  const tokensEarned = tierTokens + weekly.reward.tokens + legacyTokens;
  return { ...next, seasonJourneyScores:{ ...state.seasonJourneyScores, [journeyKey]:nextScore }, claimedSeasonJourneyTiers:claims, seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:(state.seasonTokenBalances[journeyKey] ?? 0) + tokensEarned }, weeklyDirectiveKey:weekKey, weeklyDirectiveProgress:weekly.progress, rewardedWeeklyDirectives:rewardedWeekly, seasonJourneyHistory:state.seasonJourneyHistory, seasonShopPurchases:state.seasonShopPurchases, claimedSeasonKeepsakeMilestones:state.claimedSeasonKeepsakeMilestones ?? [], claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [], claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [], unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [], gold:next.gold + gold, gems:next.gems + gems, lastLiveOpsProgress:{ journeyPoints:weekly.reward.journeyPoints, seasonTiersClaimed:earnedTiers.map(tier => tier.tier), weeklyCompleted:weekly.completed.map(item => item.id), tokensEarned } };
}
