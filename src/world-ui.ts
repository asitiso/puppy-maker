import type { GameState } from './game';
import { expeditionSeasonClaimKey, expeditionSeasonKey, expeditionSeasonTiers, type ExpeditionSeasonTier } from './expedition-season';
import { expeditionRegionDefinitions, type ExpeditionRegionId } from './expedition-regions';
import { regionalRenownLevel, regionalRenownThresholds } from './regional-renown';
import { monthlyWorldContracts, worldContractRewardKey, type WorldContractId } from './world-contracts';
import { worldEvent } from './world-event';

const clampPercent = (value:number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
const regionLabel = (id:ExpeditionRegionId) => expeditionRegionDefinitions.find(region => region.id === id)?.name ?? id;

export type WorldUiSummary = {
  event:{
    label:string;
    description:string;
    regionId:ExpeditionRegionId;
    regionLabel:string;
    bonusLabel:string;
  };
  season:{
    key:string;
    score:number;
    nextThreshold:number|null;
    percent:number;
    tiers:Array<{
      tier:ExpeditionSeasonTier;
      threshold:number;
      rewardLabel:string;
      status:'claimed'|'earned'|'locked';
    }>;
  };
  regions:Array<{
    id:ExpeditionRegionId;
    label:string;
    renown:number;
    level:number;
    nextThreshold:number|null;
    percent:number;
  }>;
  contracts:Array<{
    id:WorldContractId;
    label:string;
    description:string;
    progress:number;
    target:number;
    percent:number;
    rewardLabel:string;
    rewarded:boolean;
  }>;
  completedContracts:number;
};

export function worldUiSummary(state:GameState): WorldUiSummary {
  const event = worldEvent(state.year, state.month);
  const seasonKey = expeditionSeasonKey(state.year, state.month);
  const score = Math.max(0, Math.floor(state.expeditionSeasonScores[seasonKey] ?? 0));
  const nextTier = expeditionSeasonTiers.find(tier => score < tier.threshold) ?? null;
  const tiers = expeditionSeasonTiers.map(tier => {
    const claimKey = expeditionSeasonClaimKey(seasonKey, tier.tier);
    const claimed = state.claimedExpeditionSeasonTiers.includes(claimKey);
    const rewardLabel = [tier.reward.gold ? `${tier.reward.gold}G` : '', tier.reward.gems ? `보석 ${tier.reward.gems}` : ''].filter(Boolean).join(' · ');
    return {
      tier:tier.tier,
      threshold:tier.threshold,
      rewardLabel,
      status:claimed ? 'claimed' as const : score >= tier.threshold ? 'earned' as const : 'locked' as const,
    };
  });

  const regions = expeditionRegionDefinitions.map(region => {
    const renown = Math.max(0, Math.floor(state.regionalRenown[region.id] ?? 0));
    const level = regionalRenownLevel(renown);
    const nextThreshold = level >= 5 ? null : regionalRenownThresholds[level];
    const currentThreshold = regionalRenownThresholds[level - 1];
    const percent = nextThreshold === null
      ? 100
      : clampPercent(((renown - currentThreshold) / Math.max(1, nextThreshold - currentThreshold)) * 100);
    return { id:region.id, label:region.name, renown, level, nextThreshold, percent };
  });

  const contracts = monthlyWorldContracts(state.year, state.month, event).map(contract => {
    const progress = Math.max(0, Math.floor(state.worldContractProgress[contract.id] ?? 0));
    const rewardKey = worldContractRewardKey(state.year, state.month, contract.id);
    const rewardLabel = [contract.reward.gold ? `${contract.reward.gold}G` : '', contract.reward.gems ? `보석 ${contract.reward.gems}` : ''].filter(Boolean).join(' · ');
    return {
      id:contract.id,
      label:contract.label,
      description:contract.description,
      progress,
      target:contract.target,
      percent:clampPercent((progress / Math.max(1, contract.target)) * 100),
      rewardLabel,
      rewarded:state.rewardedWorldContracts.includes(rewardKey),
    };
  });

  return {
    event:{
      label:event.label,
      description:event.description,
      regionId:event.region,
      regionLabel:regionLabel(event.region),
      bonusLabel:'추천 지역 +5 시즌점수 · S등급 재료 +1',
    },
    season:{
      key:seasonKey,
      score,
      nextThreshold:nextTier?.threshold ?? null,
      percent:nextTier ? clampPercent((score / nextTier.threshold) * 100) : 100,
      tiers,
    },
    regions,
    contracts,
    completedContracts:contracts.filter(contract => contract.rewarded).length,
  };
}

export type WorldResultSummary = {
  regionLabel:string;
  renownLabel:string;
  seasonLabel:string;
  eventMaterialLabel:string|null;
  seasonRewardLabel:string|null;
  contractLabel:string|null;
};

export function worldResultSummary(state:GameState): WorldResultSummary|null {
  const progress = state.lastWorldProgress;
  if (!progress) return null;
  const contracts = monthlyWorldContracts(state.year, state.month, worldEvent(state.year, state.month));
  const completedLabels = progress.completedContracts
    .map(id => contracts.find(contract => contract.id === id)?.label)
    .filter((label):label is string => Boolean(label));
  return {
    regionLabel:regionLabel(progress.region),
    renownLabel:`+${progress.renownGain} · Lv.${progress.renownLevel}`,
    seasonLabel:`+${progress.seasonPoints}점${progress.eventSeasonPoints > 0 ? ` (이벤트 +${progress.eventSeasonPoints})` : ''}`,
    eventMaterialLabel:progress.eventMaterialBonus > 0 ? `추천 지역 S등급 재료 +${progress.eventMaterialBonus}` : null,
    seasonRewardLabel:progress.seasonTiersClaimed.length
      ? `시즌 보상 ${progress.seasonTiersClaimed.join('·')}단계 자동 수령`
      : null,
    contractLabel:completedLabels.length ? `${completedLabels.join(' · ')} 완료` : null,
  };
}
