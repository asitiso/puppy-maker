import type { CallingSignatureId } from './calling-signatures';
import type { ExpeditionActionCounts } from './expedition-combat';
import { isBossStage } from './expedition-bosses';
import type { ExpeditionGrade, ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';
import type { GuardianCallingId } from './guardian-callings';
import { activeCallingTraits, type GrowthTraitId } from './growth-traits';

const legendEffects = ['vanguard_legend','arcanist_legend','pathfinder_legend'] as const;

function safeNonNegativeInt(value:number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function safePositiveInt(value:number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function canonicalLegendRewardKeys(raw:readonly string[]): string[] {
  const result:string[] = [];
  for (const value of raw) {
    const match = /^(\d+)-(\d+):([a-z0-9_]+)$/.exec(value);
    if (!match) continue;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const effect = match[3];
    if (year < 1 || month < 1 || month > 12 || !legendEffects.includes(effect as typeof legendEffects[number])) continue;
    const key = `${year}-${month}:${effect}`;
    if (!result.includes(key)) result.push(key);
  }
  return result;
}

export function legendRewardKey(year:number, month:number, effectId:string): string {
  const safeYear = safePositiveInt(year);
  const safeMonth = Number.isFinite(month) ? Math.max(1, Math.min(12, Math.floor(month))) : 1;
  return `${safeYear}-${safeMonth}:${effectId}`;
}

export function effectivePathfinderExplorationXp(
  xp:number,
  calling:GuardianCallingId | null,
  traits:readonly GrowthTraitId[],
): number {
  const active = new Set(activeCallingTraits(calling, [...traits]));
  return safeNonNegativeInt(xp) + (active.has('pathfinder_eye') ? 3 : 0);
}

export function specialistMasteryCalling(
  calling:GuardianCallingId | null,
  actions:ExpeditionActionCounts,
  summary:{ stageId:ExpeditionStageId; grade:ExpeditionGrade; discovery:string | null; materialReward:number },
): GuardianCallingId | null {
  if (!calling || summary.grade === 'C') return null;
  if (calling === 'vanguard') return safeNonNegativeInt(actions.attack) > 0 ? calling : null;
  if (calling === 'arcanist') return safeNonNegativeInt(actions.charge) > 0 ? calling : null;
  if (calling === 'caretaker') return safeNonNegativeInt(actions.dodge) > 0 ? calling : null;
  const acted = safeNonNegativeInt(actions.attack) + safeNonNegativeInt(actions.dodge) + safeNonNegativeInt(actions.charge) > 0;
  const explored = summary.discovery !== null || safeNonNegativeInt(summary.materialReward) > 0 || isBossStage(summary.stageId);
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

export function applyExpeditionCallingRewards(input:ExpeditionCallingRewardInput): ExpeditionCallingRewardResult {
  let extraMaterial = 0;
  let fatigueDelta = safeNonNegativeInt(input.fatigueDelta);
  let stressDelta = safeNonNegativeInt(input.stressDelta);
  let legendRewardKeys = canonicalLegendRewardKeys(input.legendRewardKeys);
  const applied:string[] = [];
  const signatures = new Set(input.signatures);
  const traits = new Set(activeCallingTraits(input.calling, [...input.traits]));

  if (input.calling === 'pathfinder') {
    if (signatures.has('trail_reading') && input.firstClear && safeNonNegativeInt(input.materialReward) > 0) {
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

  if (input.calling === 'vanguard' && traits.has('vanguard_legend') && input.firstClear) {
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
  const canonicalKeys = canonicalLegendRewardKeys(existingKeys);
  const active = new Set(activeCallingTraits(calling, [...traits]));
  if (!active.has('pathfinder_legend') || !discovered) {
    return { goldBonus:0, legendRewardKeys:canonicalKeys, applied:false };
  }
  const key = legendRewardKey(year, month, 'pathfinder_legend');
  if (canonicalKeys.includes(key)) return { goldBonus:0, legendRewardKeys:canonicalKeys, applied:false };
  return { goldBonus:100, legendRewardKeys:[...canonicalKeys, key], applied:true };
}
