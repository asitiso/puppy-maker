import type { GameState } from './game-live-base';
import { seasonArchiveRecords } from './season-archive';
import { seasonJourneyKey, seasonJourneyTiers } from './season-journey';
import { seasonKeepsakeCollection, seasonKeepsakeMilestones } from './season-keepsakes';
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
  const claimed = state.claimedSeasonKeepsakeMilestones ?? [];
  const nextMilestone = seasonKeepsakeMilestones.find(item => !claimed.includes(item.id)) ?? null;
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
    keepsakes:{ ...collection, claimed, nextMilestone },
    archive:seasonArchiveRecords(state.seasonJourneyHistory),
  };
}
