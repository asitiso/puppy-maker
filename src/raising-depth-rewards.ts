import { bondSceneDefinitions, bondSceneIds, eligibleBondScenes, type BondSceneId } from './bond-scenes';
import type { CallingMasteryState } from './calling-mastery';
import type { GuardianCallingId } from './guardian-callings';
import type { GuardianRankId } from './guardian-rank';
import { isBossStage } from './expedition-bosses';
import type { ExpeditionStageId } from './expedition-regions';

export type BondRewardProgress = {
  affection:number;
  outings:number;
  trainings:number;
  gifts:number;
  guardianRank:GuardianRankId;
  bossClears:number;
  annualRecords:number;
  unlocked:BondSceneId[];
  rewarded:BondSceneId[];
  gold:number;
  gems:number;
};

export function reconcileBondSceneRewards(progress: BondRewardProgress) {
  const eligible = eligibleBondScenes({
    affection:progress.affection,
    outings:progress.outings,
    trainings:progress.trainings,
    gifts:progress.gifts,
    guardianRank:progress.guardianRank,
    bossClears:progress.bossClears,
    annualRecords:progress.annualRecords,
    alreadyUnlocked:progress.unlocked,
  });
  const unlocked = bondSceneIds.filter(id => progress.unlocked.includes(id) || eligible.includes(id));
  const newlyRewarded = unlocked.filter(id => !progress.rewarded.includes(id));
  if (!newlyRewarded.length) return {
    changed:unlocked.length !== progress.unlocked.length,
    unlocked,
    rewarded:progress.rewarded,
    gold:progress.gold,
    gems:progress.gems,
    newlyUnlocked:eligible.filter(id => !progress.unlocked.includes(id)),
  };
  let gold = progress.gold;
  let gems = progress.gems;
  for (const id of newlyRewarded) {
    const reward = bondSceneDefinitions.find(item => item.id === id)?.reward;
    gold += reward?.gold ?? 0;
    gems += reward?.gems ?? 0;
  }
  return {
    changed:true,
    unlocked,
    rewarded:bondSceneIds.filter(id => progress.rewarded.includes(id) || newlyRewarded.includes(id)),
    gold,
    gems,
    newlyUnlocked:eligible.filter(id => !progress.unlocked.includes(id)),
  };
}

export function monthGrowthPointReward(trainingScore:number): number {
  return 1 + (trainingScore >= 900 ? 1 : 0);
}

export function incrementCallingMonthMastery(mastery: CallingMasteryState, calling: GuardianCallingId | null): CallingMasteryState {
  if (!calling) return mastery;
  return { ...mastery, [calling]:mastery[calling] + 1 };
}

export function applyBossGrowthPointReward(stageId: ExpeditionStageId, firstClear:boolean, rewarded:ExpeditionStageId[], points:number) {
  if (!firstClear || !isBossStage(stageId) || rewarded.includes(stageId)) return { points, rewarded };
  return { points:points + 1, rewarded:[...rewarded, stageId] };
}
