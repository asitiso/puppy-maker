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
import {
  emptySanctuaryLevels,
  resolveSanctuaryUpgrade,
  sanitizeSanctuaryLevels,
  sanctuaryEffects,
  type SanctuaryFacilityId,
  type SanctuaryLevels,
} from './starlight-sanctuary';

export type GameState = Live.GameState & {
  claimedSeasonCompletionHonors:SeasonCompletionHonorId[];
  claimedSeasonMasteryRanks:SeasonMasteryRewardRank[];
  unlockedSeasonLegacyNodes:SeasonLegacyNodeId[];
  sanctuaryLevels:SanctuaryLevels;
};

export type Action = Live.Action
  | { type:'PURCHASE_SEASON_OFFER'; offerId:SeasonShopOfferId }
  | { type:'UNLOCK_SEASON_LEGACY_NODE'; nodeId:SeasonLegacyNodeId }
  | { type:'UPGRADE_SANCTUARY'; facility:SanctuaryFacilityId };

export const initialState:GameState = {
  ...Live.initialState,
  claimedSeasonCompletionHonors:[],
  claimedSeasonMasteryRanks:[],
  unlockedSeasonLegacyNodes:[],
  sanctuaryLevels:emptySanctuaryLevels(),
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
    sanctuaryLevels:sanitizeSanctuaryLevels(source.sanctuaryLevels),
  };
}

function preserveSeasonMeta(state:GameState, next:Live.GameState):GameState {
  if (next === state) return state;
  return {
    ...next,
    claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [],
    claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [],
    unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [],
    sanctuaryLevels:state.sanctuaryLevels ?? emptySanctuaryLevels(),
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

function applySeasonMasteryRewards(previous:GameState, next:GameState):GameState {
  const claimed = previous.claimedSeasonMasteryRanks ?? [];
  const keepsakes = seasonKeepsakeCollection(next.seasonShopPurchases).total;
  const completedSeasons = next.seasonJourneyHistory.filter(entry => entry.tiersCompleted >= 10).length;
  const honors = next.claimedSeasonCompletionHonors.length;
  const score = seasonMasteryScore({ completedSeasons, keepsakes, honors });
  const earned = newlyEarnedSeasonMasteryRewards(score,claimed);
  if (!earned.length) return { ...next, claimedSeasonMasteryRanks:claimed };
  return {
    ...next,
    gold:next.gold + earned.reduce((sum,item) => sum + item.reward.gold,0),
    gems:next.gems + earned.reduce((sum,item) => sum + item.reward.gems,0),
    claimedSeasonMasteryRanks:[...claimed,...earned.map(item => item.rank)],
  };
}

function applySanctuaryTraining(previous:GameState,next:GameState):GameState {
  const effects = sanctuaryEffects(previous.sanctuaryLevels ?? emptySanctuaryLevels());
  let result = next;
  if (effects.trainingPercent > 0) {
    const stats = { ...next.stats };
    const growthStats = ['strength','intelligence','magic','morality'] as const;
    for (const key of growthStats) {
      const delta = Math.max(0,next.stats[key] - previous.stats[key]);
      if (delta > 0) stats[key] = Math.min(100,next.stats[key] + delta * effects.trainingPercent / 100);
    }
    result = { ...result, stats };
  }
  const grade = Base.trainingGrade(previous.trainingScore);
  const masteryBonus = effects.masteryAllMonth || ((grade === 'A' || grade === 'S') ? effects.masteryStrongMonth : 0);
  if (masteryBonus > 0) {
    const ids = Object.keys(next.mastery) as Array<keyof typeof next.mastery>;
    const target = ids
      .filter(id => next.mastery[id].xp > previous.mastery[id].xp)
      .sort((a,b) => (next.mastery[b].xp - previous.mastery[b].xp) - (next.mastery[a].xp - previous.mastery[a].xp))[0];
    if (target) result = { ...result, mastery:{ ...result.mastery, [target]:{ ...result.mastery[target], xp:result.mastery[target].xp + 1 } } };
  }
  return result;
}

function applySanctuaryRecovery(state:GameState):GameState {
  const effects = sanctuaryEffects(state.sanctuaryLevels ?? emptySanctuaryLevels());
  if (!effects.fatigueRecovery && !effects.stressRecovery) return state;
  const stats = {
    ...state.stats,
    fatigue:Math.max(0,state.stats.fatigue - effects.fatigueRecovery),
    stress:Math.max(0,state.stats.stress - effects.stressRecovery),
  };
  return { ...state, stats, condition:Base.deriveCondition(stats) };
}

function applySanctuaryObservatory(previous:GameState,next:GameState):GameState {
  const bonus = sanctuaryEffects(previous.sanctuaryLevels ?? emptySanctuaryLevels()).expeditionJourneyBonus;
  if (!bonus || !next.lastExpeditionResult?.accepted) return next;
  const key = seasonJourneyKey(previous.year,previous.month);
  const previousBonusScore = next.seasonJourneyScores[key] ?? 0;
  const score = previousBonusScore + bonus;
  const earned = newlyEarnedJourneyTiers(previousBonusScore,score,next.claimedSeasonJourneyTiers,key);
  const claims = [...next.claimedSeasonJourneyTiers];
  let gold = 0;
  let gems = 0;
  let tokens = 0;
  for (const tier of earned) {
    claims.push(journeyTierClaimKey(key,tier.tier));
    gold += tier.reward.gold;
    gems += tier.reward.gems;
    tokens += tier.reward.tokens;
  }
  return {
    ...next,
    seasonJourneyScores:{ ...next.seasonJourneyScores, [key]:score },
    claimedSeasonJourneyTiers:claims,
    seasonTokenBalances:{ ...next.seasonTokenBalances, [key]:(next.seasonTokenBalances[key] ?? 0) + tokens },
    gold:next.gold + gold,
    gems:next.gems + gems,
    lastLiveOpsProgress:next.lastLiveOpsProgress ? {
      ...next.lastLiveOpsProgress,
      journeyPoints:next.lastLiveOpsProgress.journeyPoints + bonus,
      seasonTiersClaimed:[...next.lastLiveOpsProgress.seasonTiersClaimed,...earned.map(item => item.tier)],
      tokensEarned:next.lastLiveOpsProgress.tokensEarned + tokens,
    } : next.lastLiveOpsProgress,
  };
}

export function reducer(state:GameState, action:Action):GameState {
  if (action.type === 'RESET') return initialState;

  if (action.type === 'UPGRADE_SANCTUARY') {
    const result = resolveSanctuaryUpgrade({
      facility:action.facility,
      levels:state.sanctuaryLevels ?? emptySanctuaryLevels(),
      gold:state.gold,
      materials:state.expeditionMaterials,
      renown:state.regionalRenown,
    });
    if (!result.accepted) return state;
    return {
      ...state,
      gold:state.gold - result.cost.gold,
      expeditionMaterials:{
        star_bark:state.expeditionMaterials.star_bark - result.cost.materials.star_bark,
        arcane_shard:state.expeditionMaterials.arcane_shard - result.cost.materials.arcane_shard,
        wind_pearl:state.expeditionMaterials.wind_pearl - result.cost.materials.wind_pearl,
      },
      sanctuaryLevels:{ ...state.sanctuaryLevels, [action.facility]:result.nextLevel },
    };
  }

  if (action.type === 'UNLOCK_SEASON_LEGACY_NODE') {
    const result = resolveSeasonLegacyUnlock({
      nodeId:action.nodeId,
      history:state.seasonJourneyHistory,
      honors:state.claimedSeasonCompletionHonors,
      unlocked:state.unlockedSeasonLegacyNodes ?? [],
    });
    if (!result.accepted) return state;
    return {
      ...state,
      gold:state.gold + result.reward.gold,
      gems:state.gems + result.reward.gems,
      unlockedSeasonLegacyNodes:result.unlocked,
    };
  }

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
    const purchased:GameState = {
      ...state,
      gold:state.gold + result.reward.gold + keepsakeGold,
      gems:state.gems + keepsakeGems,
      inventory,
      expeditionMaterials,
      seasonTokenBalances:{ ...state.seasonTokenBalances, [journeyKey]:result.tokens },
      seasonShopPurchases,
      claimedSeasonKeepsakeMilestones:[...claimedMilestones,...keepsakeMilestones.map(item => item.id)],
      claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [],
      unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [],
      sanctuaryLevels:state.sanctuaryLevels ?? emptySanctuaryLevels(),
    };
    return applySeasonMasteryRewards(state,purchased);
  }

  if (action.type !== 'FINISH_TRAINING') {
    const liveNext = Live.reducer(state,action);
    if (liveNext === state) return state;
    let preserved = preserveSeasonMeta(state,liveNext);
    if (action.type === 'FINISH_EXPEDITION_STAGE') preserved = applySanctuaryObservatory(state,preserved);
    if (action.type !== 'NEXT_MONTH') return preserved;
    preserved = applySanctuaryRecovery(preserved);
    const honored = applySeasonCompletionHonors(state,preserved);
    return applySeasonMasteryRewards(state,honored);
  }

  const baseNext = Base.reducer(state,action as Base.Action);
  if (baseNext === state) return state;
  const rawNext:GameState = {
    ...state,
    ...baseNext,
    claimedSeasonCompletionHonors:state.claimedSeasonCompletionHonors ?? [],
    claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [],
    unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [],
    sanctuaryLevels:state.sanctuaryLevels ?? emptySanctuaryLevels(),
  };
  const next = applySanctuaryTraining(state,rawNext);
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
    claimedSeasonMasteryRanks:state.claimedSeasonMasteryRanks ?? [],
    unlockedSeasonLegacyNodes:state.unlockedSeasonLegacyNodes ?? [],
    sanctuaryLevels:state.sanctuaryLevels ?? emptySanctuaryLevels(),
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
