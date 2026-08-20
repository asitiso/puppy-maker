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

function sameIds(left: BondSceneId[], right: BondSceneId[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function reconcileBondSceneRewards(_previous: BondRewardProgress, current: BondRewardProgress) {
  const claimedUnlocks = bondSceneIds.filter(id => current.unlocked.includes(id));
  const claimedRewards = bondSceneIds.filter(id => current.rewarded.includes(id));
  const provenUnlocks = bondSceneIds.filter(id => claimedUnlocks.includes(id) || claimedRewards.includes(id));
  const afterEligible = eligible({ ...current, unlocked:provenUnlocks });
  const unlocked = bondSceneIds.filter(id => provenUnlocks.includes(id) || afterEligible.includes(id));
  const newlyUnlocked = unlocked.filter(id => !claimedUnlocks.includes(id));
  const newlyRewarded = unlocked.filter(id => !claimedRewards.includes(id));
  const rewarded = bondSceneIds.filter(id => claimedRewards.includes(id) || newlyRewarded.includes(id));
  const canonicalized = !sameIds(current.unlocked, unlocked) || !sameIds(current.rewarded, rewarded);

  if (!newlyUnlocked.length && !newlyRewarded.length && !canonicalized) return {
    changed:false,
    unlocked:current.unlocked,
    rewarded:current.rewarded,
    gold:current.gold,
    gems:current.gems,
    newlyUnlocked:[] as BondSceneId[],
  };

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
    rewarded,
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
