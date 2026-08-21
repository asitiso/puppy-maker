import type { CallingSignatureId } from './calling-signatures';
import type { ExpeditionActionCounts } from './expedition-combat';
import { isBossStage } from './expedition-bosses';
import type { ExpeditionGrade, ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';
import type { GuardianCallingId } from './guardian-callings';
import type { GrowthTraitId } from './growth-traits';

const legendEffectIds = ['vanguard_legend', 'arcanist_legend', 'pathfinder_legend'] as const;
type LegendEffectId = typeof legendEffectIds[number];
const expeditionRegionIds: readonly ExpeditionRegionId[] = ['starlight_forest', 'ancient_city', 'wind_lakes'];
const guardianCallingIds: readonly GuardianCallingId[] = ['vanguard', 'arcanist', 'caretaker', 'pathfinder'];

export function legendRewardKey(year:number, month:number, effectId:string): string {
  const safeYear = Math.max(1, Math.floor(Number.isFinite(year) ? year : 1));
  const safeMonth = Math.max(1, Math.min(12, Math.floor(Number.isFinite(month) ? month : 1)));
  return `${safeYear}-${safeMonth}:${effectId}`;
}

function sanitizeLegendRewardKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const validEffects = new Set<string>(legendEffectIds);
  const keys:string[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== 'string' || !value) continue;
    const match = /^(\d+)-(\d+):([a-z_]+)$/.exec(value);
    if (!match) continue;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const effectId = match[3] as LegendEffectId;
    if (!Number.isSafeInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12 || !validEffects.has(effectId)) continue;
    const canonical = legendRewardKey(year, month, effectId);
    if (canonical !== value || seen.has(canonical)) continue;
    seen.add(canonical);
    keys.push(canonical);
  }
  return keys;
}

function safeTraits(raw: unknown): readonly GrowthTraitId[] {
  return Array.isArray(raw) ? raw as readonly GrowthTraitId[] : [];
}

function safeSignatures(raw: unknown): readonly CallingSignatureId[] {
  return Array.isArray(raw) ? raw as readonly CallingSignatureId[] : [];
}

export function effectivePathfinderExplorationXp(
  xp:number,
  calling:GuardianCallingId | null,
  traits:readonly GrowthTraitId[],
): number {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  return safeXp + (calling === 'pathfinder' && safeTraits(traits).includes('pathfinder_eye') ? 3 : 0);
}

function hasValidAction(value:unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasValidDiscovery(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function hasValidRegion(value: unknown): value is ExpeditionRegionId {
  return typeof value === 'string' && expeditionRegionIds.includes(value as ExpeditionRegionId);
}

function hasValidCalling(value: unknown): value is GuardianCallingId {
  return typeof value === 'string' && guardianCallingIds.includes(value as GuardianCallingId);
}

function safeActions(raw: unknown): Partial<ExpeditionActionCounts> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? raw as Partial<ExpeditionActionCounts>
    : {};
}

export function specialistMasteryCalling(
  calling:GuardianCallingId | null,
  actions:ExpeditionActionCounts,
  summary:{ stageId:ExpeditionStageId; grade:ExpeditionGrade; discovery:string | null; materialReward:number },
): GuardianCallingId | null {
  const successful = summary.grade === 'B' || summary.grade === 'A' || summary.grade === 'S';
  if (!hasValidCalling(calling) || !successful) return null;
  const actionCounts = safeActions(actions);
  if (calling === 'vanguard') return hasValidAction(actionCounts.attack) ? calling : null;
  if (calling === 'arcanist') return hasValidAction(actionCounts.charge) ? calling : null;
  if (calling === 'caretaker') return hasValidAction(actionCounts.dodge) ? calling : null;
  const acted = hasValidAction(actionCounts.attack) || hasValidAction(actionCounts.dodge) || hasValidAction(actionCounts.charge);
  const hasMaterialReward = Number.isFinite(summary.materialReward) && summary.materialReward > 0;
  const explored = hasValidDiscovery(summary.discovery) || hasMaterialReward || isBossStage(summary.stageId);
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
  const legendRewardKeys = sanitizeLegendRewardKeys(input.legendRewardKeys);
  const applied:string[] = [];
  const signatures = new Set(safeSignatures(input.signatures));
  const traits = new Set(safeTraits(input.traits));
  const successful = input.grade === 'B' || input.grade === 'A' || input.grade === 'S';
  const hasMaterialReward = Number.isFinite(input.materialReward) && input.materialReward > 0;
  const firstClear = input.firstClear === true;

  if (successful && input.calling === 'pathfinder') {
    if (signatures.has('trail_reading') && firstClear && hasMaterialReward) {
      extraMaterial += 1;
      applied.push('trail_reading');
    }
    if (signatures.has('star_compass') && hasValidRegion(input.regionCompleted)) {
      extraMaterial += 1;
      applied.push('star_compass');
    }
  }

  if (input.calling === 'caretaker' && signatures.has('heart_anchor')) {
    stressDelta = Math.max(0, stressDelta - 2);
    applied.push('heart_anchor');
  }

  if (successful && input.calling === 'vanguard' && traits.has('vanguard_legend') && firstClear) {
    const key = legendRewardKey(input.year, input.month, 'vanguard_legend');
    if (!legendRewardKeys.includes(key)) {
      fatigueDelta = Math.max(0, fatigueDelta - 2);
      legendRewardKeys.push(key);
      applied.push('vanguard_legend');
    }
  }

  if (input.calling === 'arcanist' && traits.has('arcanist_legend') && (input.grade === 'A' || input.grade === 'S') && hasValidDiscovery(input.discovery)) {
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
  const legendRewardKeys = sanitizeLegendRewardKeys(existingKeys);
  if (calling !== 'pathfinder' || !safeTraits(traits).includes('pathfinder_legend') || discovered !== true) {
    return { goldBonus:0, legendRewardKeys, applied:false };
  }
  const key = legendRewardKey(year, month, 'pathfinder_legend');
  if (legendRewardKeys.includes(key)) return { goldBonus:0, legendRewardKeys, applied:false };
  return { goldBonus:100, legendRewardKeys:[...legendRewardKeys, key], applied:true };
}
