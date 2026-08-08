import type { SeasonId } from './seasonal-cycle';
import type { SeasonJourneyKey } from './season-journey';

export type SeasonKeepsakeMilestoneId = 'first_keepsake'|'four_seasons'|'eight_seasons';
export type SeasonKeepsakeMilestone = {
  id:SeasonKeepsakeMilestoneId;
  threshold:number;
  reward:{ gold:number; gems:number };
};

export const seasonKeepsakeMilestones:SeasonKeepsakeMilestone[] = [
  { id:'first_keepsake', threshold:1, reward:{ gold:200, gems:0 } },
  { id:'four_seasons', threshold:4, reward:{ gold:0, gems:2 } },
  { id:'eight_seasons', threshold:8, reward:{ gold:800, gems:3 } },
];

const keepsakePattern = /^(\d+)-(spring|summer|autumn|winter):seasonal_keepsake:1$/;
const seasonOrder:Record<SeasonId,number> = { spring:0, summer:1, autumn:2, winter:3 };

export function seasonKeepsakeCollection(purchaseKeys:string[]) {
  const keys = [...new Set(purchaseKeys.flatMap(value => {
    const match = keepsakePattern.exec(value);
    return match ? [`${Number(match[1])}-${match[2]}` as SeasonJourneyKey] : [];
  }))].sort((a,b) => {
    const [yearA,seasonA] = a.split('-') as [string,SeasonId];
    const [yearB,seasonB] = b.split('-') as [string,SeasonId];
    return Number(yearA) - Number(yearB) || seasonOrder[seasonA] - seasonOrder[seasonB];
  });
  const seasons:Record<SeasonId,number> = { spring:0, summer:0, autumn:0, winter:0 };
  for (const key of keys) {
    const season = key.split('-')[1] as SeasonId;
    seasons[season] += 1;
  }
  return { total:keys.length, keys, seasons };
}

export function newlyEarnedKeepsakeMilestones(
  purchaseKeys:string[],
  claimed:SeasonKeepsakeMilestoneId[],
):SeasonKeepsakeMilestone[] {
  const total = seasonKeepsakeCollection(purchaseKeys).total;
  return seasonKeepsakeMilestones.filter(item => total >= item.threshold && !claimed.includes(item.id));
}
