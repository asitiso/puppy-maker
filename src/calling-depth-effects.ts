import type { CallingSignatureId } from './calling-signatures';
import type { ExpeditionActionCounts } from './expedition-combat';
import { isBossStage } from './expedition-bosses';
import type { ExpeditionGrade, ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';
import type { GuardianCallingId } from './guardian-callings';
import type { GrowthTraitId } from './growth-traits';

export function legendRewardKey(year:number, month:number, effectId:string): string {
  const safeYear = Math.max(1, Math.floor(Number.isFinite(year) ? year : 1));
  const safeMonth = Math.max(1, Math.min(12, Math.floor(Number.isFinite(month) ? month : 1)));
  return `${safeYear}-${safeMonth}:${effectId}`;
}

export function effectivePathfinderExplorationXp(
  xp:number,
  calling:GuardianCallingId | null,
  traits:readonly GrowthTraitId[],
): number {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  return safeXp + (calling === 'pathfinder' && traits.includes('pathfinder_eye') ? 3 : 0);
}

export function specialistMasteryCalling(
  calling:GuardianCallingId | null,
  actions:ExpeditionActionCounts,
  summary:{ stageId:ExpeditionStageId; grade:ExpeditionGrade; discovery:string | null; materialReward:number },
): GuardianCallingId | null {
  if (!calling || summary.grade === 'C') return null;
  if (calling === 'vanguard') return actions.attack > 0 ? calling : null;
  if (calling === 'arcanist') return actions.charge > 0 ? calling : null;
  if (calling === 'caretaker') return actions.dodge > 0 ? calling : null;
  const acted = actions.attack + actions.dodge + actions.charge > 0;
  const explored = summary.discovery !== null || summary.materialReward > 0 || isBossStage(summary.stageId);
  return acted && explored ? calling : null;
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

function safeNonNegativeDelta(value:number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export function applyExpeditionCallingRewards(input:ExpeditionCallingRewardInput): ExpeditionCallingRewardResult {
  let extraMaterial = 0;
  let fatigueDelta = safeNonNegativeDelta(input.fatigueDelta);
  let stressDelta = safeNonNegativeDelta(input.stressDelta);
  let legendRewardKeys = [...input.legendRewardKeys];
  const applied:string[] = [];
  const signatures = new Set(input.signatures);
  const traits = new Set(input.traits);
  const successful = input.grade !== 'C';

  if (successful && input.calling === 'pathfinder') {
    if (signatures.has('trail_reading') && input.firstClear && input.materialReward > 0) {
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

  if (successful && input.calling === 'vanguard' && traits.has('vanguard_legend') && input.firstClear) {
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
  if (calling !== 'pathfinder' || !traits.includes('pathfinder_legend') || !discovered) {
    return { goldBonus:0, legendRewardKeys:existingKeys, applied:false };
  }
  const key = legendRewardKey(year, month, 'pathfinder_legend');
  if (existingKeys.includes(key)) return { goldBonus:0, legendRewardKeys:existingKeys, applied:false };
  return { goldBonus:100, legendRewardKeys:[...existingKeys, key], applied:true };
}
