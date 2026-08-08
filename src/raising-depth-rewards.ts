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

function eligible(progress: BondRewardProgress): BondSceneId[] {
  return eligibleBondScenes({
    affection:progress.affection,
    outings:progress.outings,
    trainings:progress.trainings,
    gifts:progress.gifts,
    guardianRank:progress.guardianRank,
    bossClears:progress.bossClears,
    annualRecords:progress.annualRecords,
    alreadyUnlocked:progress.unlocked,
  });
}

export function reconcileBondSceneRewards(previous: BondRewardProgress, current: BondRewardProgress) {
  const beforeEligible = new Set(eligible(previous));
  const afterEligible = eligible(current);
  const newlyUnlocked = afterEligible.filter(id => !beforeEligible.has(id) && !current.unlocked.includes(id));
  if (!newlyUnlocked.length) return {
    changed:false,
    unlocked:current.unlocked,
    rewarded:current.rewarded,
    gold:current.gold,
    gems:current.gems,
    newlyUnlocked:[] as BondSceneId[],
  };

  const unlocked = bondSceneIds.filter(id => current.unlocked.includes(id) || newlyUnlocked.includes(id));
  const newlyRewarded = newlyUnlocked.filter(id => !current.rewarded.includes(id));
  let gold = current.gold;
  let gems = current.gems;
  for (const id of newlyRewarded) {
    const reward = bondSceneDefinitions.find(item => item.id === id)?.reward;
    gold += reward?.gold ?? 0;
    gems += reward?.gems ?? 0;
  }
  return {
    changed:true,
    unlocked,
    rewarded:bondSceneIds.filter(id => current.rewarded.includes(id) || newlyRewarded.includes(id)),
    gold,
    gems,
    newlyUnlocked,
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
