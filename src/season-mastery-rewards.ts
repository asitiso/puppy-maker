import type { SeasonMasteryRankId } from './season-mastery-rank';

export type SeasonMasteryRewardRank = Exclude<SeasonMasteryRankId,'sprout'>;
export type SeasonMasteryReward = {
  rank:SeasonMasteryRewardRank;
  threshold:number;
  reward:{ gold:number; gems:number };
};

export const seasonMasteryRewards:SeasonMasteryReward[] = [
  { rank:'traveler', threshold:5, reward:{ gold:200, gems:0 } },
  { rank:'chronicler', threshold:12, reward:{ gold:0, gems:1 } },
  { rank:'guardian', threshold:24, reward:{ gold:500, gems:2 } },
  { rank:'eternal', threshold:40, reward:{ gold:1000, gems:5 } },
];

export function newlyEarnedSeasonMasteryRewards(
  rawScore:number,
  claimed:SeasonMasteryRewardRank[],
):SeasonMasteryReward[] {
  const score = Number.isFinite(rawScore) ? Math.max(0,Math.floor(rawScore)) : 0;
  return seasonMasteryRewards.filter(item => score >= item.threshold && !claimed.includes(item.rank));
}
