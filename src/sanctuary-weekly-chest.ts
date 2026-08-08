import type { SanctuaryPrestigeRankId } from './sanctuary-contracts';

export function sanctuaryWeeklyChestReady(
  weekKey:string,
  contractIds:string[],
  rewardedContractKeys:string[],
  claimedWeekKeys:string[],
):boolean {
  if (!contractIds.length || claimedWeekKeys.includes(weekKey)) return false;
  return contractIds.every(id => rewardedContractKeys.includes(`${weekKey}:${id}`));
}

export function sanctuaryWeeklyChestReward(rank:SanctuaryPrestigeRankId) {
  if (rank === 'haven') return { gold:220, gems:0 };
  if (rank === 'sanctum') return { gold:300, gems:1 };
  if (rank === 'citadel') return { gold:450, gems:1 };
  if (rank === 'celestial') return { gold:650, gems:2 };
  return { gold:150, gems:0 };
}
