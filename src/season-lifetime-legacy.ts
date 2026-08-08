import type { SeasonJourneyHistoryEntry } from './live-ops-state';

export type SeasonLifetimeMilestoneId = 'seed'|'traveler'|'keeper'|'guardian'|'eternal';

export type SeasonLifetimeBonuses = {
  trainingPercent:number;
  masteryXp:number;
  rewardPercent:number;
  startingCondition:number;
};

const milestones = [
  { id:'seed' as const, threshold:0, label:'계절 유산의 씨앗' },
  { id:'traveler' as const, threshold:5, label:'계절 유산 여행자' },
  { id:'keeper' as const, threshold:12, label:'계절 유산 보관자' },
  { id:'guardian' as const, threshold:25, label:'계절 유산 수호자' },
  { id:'eternal' as const, threshold:50, label:'영원의 계절 유산' },
];

export function seasonLifetimeAward(input:{ tiersCompleted:number; score:number; tokensEarned:number; keepsake:boolean }):number {
  const tiers = Number.isFinite(input.tiersCompleted) ? Math.max(0,Math.floor(input.tiersCompleted)) : 0;
  const score = Number.isFinite(input.score) ? Math.max(0,Math.floor(input.score)) : 0;
  const tokens = Number.isFinite(input.tokensEarned) ? Math.max(0,Math.floor(input.tokensEarned)) : 0;
  if (tiers < 5) return 0;
  let points = tiers >= 10 ? 2 : 1;
  if (score >= 1000) points += 1;
  if (tokens >= 100) points += 1;
  if (input.keepsake) points += 1;
  return Math.min(5,points);
}

export function seasonLifetimeBonuses(rawPoints:number):SeasonLifetimeBonuses {
  const points = Number.isFinite(rawPoints) ? Math.max(0,Math.floor(rawPoints)) : 0;
  if (points >= 50) return { trainingPercent:6, masteryXp:2, rewardPercent:8, startingCondition:3 };
  if (points >= 25) return { trainingPercent:4, masteryXp:1, rewardPercent:5, startingCondition:2 };
  if (points >= 12) return { trainingPercent:3, masteryXp:1, rewardPercent:3, startingCondition:1 };
  if (points >= 5) return { trainingPercent:2, masteryXp:0, rewardPercent:2, startingCondition:1 };
  return { trainingPercent:0, masteryXp:0, rewardPercent:0, startingCondition:0 };
}

export function seasonLifetimeMilestone(rawPoints:number) {
  const points = Number.isFinite(rawPoints) ? Math.max(0,Math.floor(rawPoints)) : 0;
  let index = 0;
  for (let candidate = 0; candidate < milestones.length; candidate += 1) {
    if (points >= milestones[candidate].threshold) index = candidate;
  }
  return {
    ...milestones[index],
    points,
    nextThreshold:milestones[index + 1]?.threshold ?? null,
  };
}

export function seasonLifetimePoints(history:SeasonJourneyHistoryEntry[], purchaseKeys:string[]):number {
  return history.reduce((sum,entry) => {
    const keepsake = purchaseKeys.some(key => key.startsWith(`${entry.key}:seasonal_keepsake:`));
    return sum + seasonLifetimeAward({
      tiersCompleted:entry.tiersCompleted,
      score:entry.score,
      tokensEarned:entry.tokensEarned,
      keepsake,
    });
  },0);
}

export function seasonLifetimeSummary(history:SeasonJourneyHistoryEntry[], purchaseKeys:string[]) {
  const points = seasonLifetimePoints(history,purchaseKeys);
  return {
    points,
    milestone:seasonLifetimeMilestone(points),
    bonuses:seasonLifetimeBonuses(points),
    completedSeasons:history.filter(entry => entry.tiersCompleted >= 10).length,
  };
}
