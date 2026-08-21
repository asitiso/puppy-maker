import type { CallingSignatureId } from './calling-signatures';
import type { ExpeditionActionCounts } from './expedition-combat';
import type { ExpeditionGrade, ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';
import type { GuardianCallingId } from './guardian-callings';
import { activeCallingTraits, type GrowthTraitId } from './growth-traits';

function nonNegativeInt(value:number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function nonNegativeNumber(value:number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function legendRewardKey(year:number, month:number, effectId:string): string {
  const safeYear = Number.isFinite(year) ? Math.max(1, Math.floor(year)) : 1;
  const safeMonth = Number.isFinite(month) ? Math.max(1, Math.min(12, Math.floor(month))) : 1;
  return `${safeYear}-${safeMonth}:${effectId}`;
}

export function effectivePathfinderExplorationXp(
  xp:number,
  calling:GuardianCallingId | null,
  traits:readonly GrowthTraitId[],
): number {
  const activeTraits = new Set(activeCallingTraits(calling, [...traits]));
  return nonNegativeInt(xp) + (activeTraits.has('pathfinder_eye') ? 3 : 0);
}

export function specialistMasteryCalling(
  calling:GuardianCallingId | null,
  actions:ExpeditionActionCounts,
  summary:{ grade:ExpeditionGrade; discovery:string | null; materialReward:number },
): GuardianCallingId | null {
  if (!calling || summary.grade === 'C') return null;
  const attack = nonNegativeInt(actions.attack);
  const dodge = nonNegativeInt(actions.dodge);
  const charge = nonNegativeInt(actions.charge);
  if (calling === 'vanguard') return attack > 0 ? calling : null;
  if (calling === 'arcanist') return charge > 0 ? calling : null;
  if (calling === 'caretaker') return dodge > 0 ? calling : null;
  const materialReward = nonNegativeInt(summary.materialReward);
  return (attack + dodge + charge > 0) && (summary.discovery !== null || materialReward > 0) ? calling : null;
}

export type ExpeditionCallingRewardInput = {
  year:number;
  month:number;
  calling:GuardianCallingId | null;
  traits:readonly GrowthTraitId[];
  signatures:readonly CallingSignatureId[];
  legendRewardKeys:string[];
  stageId:ExpeditionStageId;
  grade:ExpeditionGrade;
  firstClear:boolean;
  discovery:string | null;
  regionCompleted:ExpeditionRegionId | null;
  materialReward:number;
  fatigueDelta:number;
  stressDelta:number;
};

export type ExpeditionCallingRewardResult = {
  extraMaterial:number;
  goldBonus:number;
  fatigueDelta:number;
  stressDelta:number;
  legendRewardKeys:string[];
  applied:string[];
};

export function applyExpeditionCallingRewards(input:ExpeditionCallingRewardInput): ExpeditionCallingRewardResult {
  let extraMaterial = 0;
  let fatigueDelta = nonNegativeNumber(input.fatigueDelta);
  let stressDelta = nonNegativeNumber(input.stressDelta);
  let legendRewardKeys = [...new Set(input.legendRewardKeys)];
  const applied:string[] = [];
  const signatures = new Set(input.signatures);
  const traits = new Set(activeCallingTraits(input.calling, [...input.traits]));
  const materialReward = nonNegativeInt(input.materialReward);

  if (input.calling === 'pathfinder') {
    if (signatures.has('trail_reading') && input.firstClear && materialReward > 0) {
      extraMaterial += 1;
      applied.push('trail_reading');
    }
    if (signatures.has('star_compass') && input.regionCompleted) {
      extraMaterial += 1;
      applied.push('star_compass');
    }
  }

  if (input.calling === 'caretaker' && signatures.has('heart_anchor')) {
    stressDelta = Math.max(0, stressDelta - 2);
    applied.push('heart_anchor');
  }

  if (input.calling === 'vanguard' && traits.has('vanguard_legend') && input.grade !== 'C') {
    const key = legendRewardKey(input.year, input.month, 'vanguard_legend');
    if (!legendRewardKeys.includes(key)) {
      fatigueDelta = Math.max(0, fatigueDelta - 2);
      legendRewardKeys.push(key);
      applied.push('vanguard_legend');
    }
  }

  if (input.calling === 'arcanist' && traits.has('arcanist_legend') && (input.grade === 'A' || input.grade === 'S') && input.discovery) {
    const key = legendRewardKey(input.year, input.month, 'arcanist_legend');
    if (!legendRewardKeys.includes(key)) {
      stressDelta = Math.max(0, stressDelta - 2);
      legendRewardKeys.push(key);
      applied.push('arcanist_legend');
    }
  }

  return { extraMaterial, goldBonus:0, fatigueDelta, stressDelta, legendRewardKeys, applied };
}

export function applyPathfinderOutingLegend(
  year:number,
  month:number,
  calling:GuardianCallingId | null,
  traits:readonly GrowthTraitId[],
  discovered:boolean,
  existingKeys:string[],
): { goldBonus:number; legendRewardKeys:string[]; applied:boolean } {
  const activeTraits = new Set(activeCallingTraits(calling, [...traits]));
  if (!activeTraits.has('pathfinder_legend') || !discovered) {
    return { goldBonus:0, legendRewardKeys:existingKeys, applied:false };
  }
  const key = legendRewardKey(year, month, 'pathfinder_legend');
  if (existingKeys.includes(key)) return { goldBonus:0, legendRewardKeys:existingKeys, applied:false };
  return { goldBonus:100, legendRewardKeys:[...existingKeys, key], applied:true };
}
