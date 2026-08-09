import type { GameState } from './game';
import { seasonArchiveRecords } from './season-archive';
import { seasonJourneyKey, seasonJourneyTiers } from './season-journey';
import { seasonKeepsakeCollection, seasonKeepsakeMilestones } from './season-keepsakes';
import { seasonCompletionHonors, seasonHonorProgress } from './season-completion-honors';
import { seasonMasteryRank, seasonMasteryScore } from './season-mastery-rank';
import { seasonMasteryRewards } from './season-mastery-rewards';
import { seasonLegacyBoard, seasonLegacyPoints, seasonLegacyNodes } from './season-legacy-board';
import { seasonLegacyCrownSynergy } from './season-legacy-effects';
import { seasonLifetimeSummary } from './season-lifetime-legacy';
import { seasonShopOffers } from './season-shop';
import { weeklyDirectiveKey, weeklyDirectives } from './weekly-directives';

const seasonLabels = { spring:'봄', summer:'여름', autumn:'가을', winter:'겨울' } as const;

export function liveOpsUiSummary(state:GameState) {
  const key = seasonJourneyKey(state.year,state.month);
  const score = Math.max(0,Math.floor(state.seasonJourneyScores[key] ?? 0));
  const tokens = Math.max(0,Math.floor(state.seasonTokenBalances[key] ?? 0));
  const nextTier = seasonJourneyTiers.find(tier => score < tier.threshold) ?? null;
  const currentWeekKey = weeklyDirectiveKey(state.year,state.month,state.week);
  const progress = state.weeklyDirectiveKey === currentWeekKey ? state.weeklyDirectiveProgress : {};
  const [,seasonId] = key.split('-') as [string,keyof typeof seasonLabels];
  const directives = weeklyDirectives(state.year,state.month,state.week).map(directive => {
    const current = Math.min(directive.target,Math.max(0,Math.floor(progress[directive.id] ?? 0)));
    const rewarded = state.rewardedWeeklyDirectives.includes(`${currentWeekKey}:${directive.id}`);
    return { ...directive, current, completed:current >= directive.target, rewarded };
  });
  const shop = seasonShopOffers(key).map(offer => {
    const prefix = `${key}:${offer.id}:`;
    const purchased = state.seasonShopPurchases.filter(purchase => purchase.startsWith(prefix)).length;
    const remaining = Math.max(0,offer.limit - purchased);
    return { ...offer, purchased, remaining, canBuy:remaining > 0 && tokens >= offer.cost };
  });
  const collection = seasonKeepsakeCollection(state.seasonShopPurchases);
  const claimedKeepsakes = state.claimedSeasonKeepsakeMilestones ?? [];
  const nextMilestone = seasonKeepsakeMilestones.find(item => !claimedKeepsakes.includes(item.id)) ?? null;
  const honorProgress = seasonHonorProgress(state.seasonJourneyHistory);
  const claimedHonors = state.claimedSeasonCompletionHonors ?? [];
  const honorItems = seasonCompletionHonors.map(item => ({
    ...item,
    current:honorProgress[item.metric],
    claimed:claimedHonors.includes(item.id),
  }));
  const masteryScore = seasonMasteryScore({
    completedSeasons:honorProgress.completedSeasons,
    keepsakes:collection.total,
    honors:claimedHonors.length,
  });
  const mastery = seasonMasteryRank(masteryScore);
  const claimedMasteryRewards = state.claimedSeasonMasteryRanks ?? [];
  const masteryRewardItems = seasonMasteryRewards.map(item => ({
    ...item,
    claimed:claimedMasteryRewards.includes(item.rank),
    unlocked:masteryScore >= item.threshold,
  }));
  const nextMasteryReward = masteryRewardItems.find(item => !item.claimed) ?? null;
  const unlockedLegacy = state.unlockedSeasonLegacyNodes ?? [];
  const earnedLegacy = seasonLegacyPoints(state.seasonJourneyHistory,claimedHonors);
  const spentLegacy = unlockedLegacy.reduce((sum,id) => sum + (seasonLegacyNodes.find(node => node.id === id)?.cost ?? 0),0);
  const availableLegacy = Math.max(0,earnedLegacy - spentLegacy);
  const legacyNodes = seasonLegacyBoard(unlockedLegacy).map(node => ({
    ...node,
    affordable:node.available && availableLegacy >= node.cost,
  }));
  const legacySynergy = seasonLegacyCrownSynergy(unlockedLegacy);
  const lifetimeLegacy = seasonLifetimeSummary(state.seasonJourneyHistory,state.seasonShopPurchases);
  return {
    season:{
      key,
      label:`${state.year}년차 ${seasonLabels[seasonId]}`,
      score,
      tokens,
      nextTier,
      progressPercent:Math.min(100,Math.floor(score / seasonJourneyTiers.at(-1)!.threshold * 100)),
    },
    directives,
    shop,
    keepsakes:{ ...collection, claimed:claimedKeepsakes, nextMilestone },
    honors:{ progress:honorProgress, items:honorItems, claimed:claimedHonors },
    mastery,
    masteryRewards:{ claimed:claimedMasteryRewards, items:masteryRewardItems, next:nextMasteryReward },
    legacy:{ earned:earnedLegacy, spent:spentLegacy, available:availableLegacy, nodes:legacyNodes, synergy:legacySynergy },
    lifetimeLegacy,
    archive:seasonArchiveRecords(state.seasonJourneyHistory),
  };
}
