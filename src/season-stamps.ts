import type { OutingLocationId } from './adventure';
import { seasonalProfile, type SeasonId } from './seasonal-cycle';

export type SeasonStampId = SeasonId;

export type SeasonStampDefinition = {
  id: SeasonStampId;
  label: string;
  rewardGems: number;
};

export const seasonStampDefinitions: SeasonStampDefinition[] = [
  { id:'spring', label:'새싹 인장', rewardGems:1 },
  { id:'summer', label:'물결 인장', rewardGems:1 },
  { id:'autumn', label:'별바람 인장', rewardGems:1 },
  { id:'winter', label:'눈꽃 인장', rewardGems:1 },
];

export const seasonStampIds = seasonStampDefinitions.map(item => item.id);
export const fourSeasonCompletionRewardGems = 3;

export function stampForOuting(month: number, location: OutingLocationId): SeasonStampId | null {
  const profile = seasonalProfile(month);
  return profile.outing === location ? profile.season : null;
}

export function completesFourSeasons(current: SeasonStampId[], next: SeasonStampId): boolean {
  return !current.includes(next) && current.length === seasonStampIds.length - 1;
}
