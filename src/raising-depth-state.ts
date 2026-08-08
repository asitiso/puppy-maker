import { bondSceneIds, type BondSceneId } from './bond-scenes';
import { emptyCallingMastery, type CallingMasteryState } from './calling-mastery';
import { guardianCallingIds, type GuardianCallingId } from './guardian-callings';
import { growthTraitIds, type GrowthTraitId } from './growth-traits';
import { expeditionStageDefinitions, type ExpeditionStageId } from './expedition-regions';

export type RaisingDepthPersistentState = {
  activeCalling: GuardianCallingId | null;
  callingHistory: GuardianCallingId[];
  callingMastery: CallingMasteryState;
  callingLastSwitchKey: string | null;
  growthPoints: number;
  purchasedTraits: GrowthTraitId[];
  unlockedBondScenes: BondSceneId[];
  rewardedBondScenes: BondSceneId[];
  growthPointBossRewards: ExpeditionStageId[];
  legendRewardKeys: string[];
};

const bossStageIds = expeditionStageDefinitions.filter(item => item.boss).map(item => item.id);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const int = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function emptyRaisingDepthState(): RaisingDepthPersistentState {
  return {
    activeCalling:null,
    callingHistory:[],
    callingMastery:emptyCallingMastery(),
    callingLastSwitchKey:null,
    growthPoints:0,
    purchasedTraits:[],
    unlockedBondScenes:[],
    rewardedBondScenes:[],
    growthPointBossRewards:[],
    legendRewardKeys:[],
  };
}

function uniqueAllowed<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(raw)) return [];
  return allowed.filter(id => raw.includes(id));
}

function hydrateSwitchKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const match = /^(\d+)-(\d+)$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1 && month >= 1 && month <= 12 ? `${year}-${month}` : null;
}

function hydrateLegendRewardKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const valid = raw.filter((value): value is string => typeof value === 'string' && /^\d+-\d+:[a-z0-9_:-]+$/.test(value));
  return [...new Set(valid)];
}

export function hydrateRaisingDepthState(raw: unknown): RaisingDepthPersistentState {
  const source = isRecord(raw) ? raw : {};
  const activeCalling = typeof source.activeCalling === 'string' && guardianCallingIds.includes(source.activeCalling as GuardianCallingId)
    ? source.activeCalling as GuardianCallingId
    : null;
  const masterySource = isRecord(source.callingMastery) ? source.callingMastery : {};
  const unlockedBondScenes = uniqueAllowed(source.unlockedBondScenes, bondSceneIds);
  const rewardedBondScenes = uniqueAllowed(source.rewardedBondScenes, bondSceneIds).filter(id => unlockedBondScenes.includes(id));
  return {
    activeCalling,
    callingHistory:uniqueAllowed(source.callingHistory, guardianCallingIds),
    callingMastery:Object.fromEntries(guardianCallingIds.map(id => [id, int(masterySource[id])])) as CallingMasteryState,
    callingLastSwitchKey:hydrateSwitchKey(source.callingLastSwitchKey),
    growthPoints:int(source.growthPoints),
    purchasedTraits:uniqueAllowed(source.purchasedTraits, growthTraitIds),
    unlockedBondScenes,
    rewardedBondScenes,
    growthPointBossRewards:uniqueAllowed(source.growthPointBossRewards, bossStageIds),
    legendRewardKeys:hydrateLegendRewardKeys(source.legendRewardKeys),
  };
}

export function pickRaisingDepthState(state: RaisingDepthPersistentState): RaisingDepthPersistentState {
  return {
    activeCalling:state.activeCalling,
    callingHistory:state.callingHistory,
    callingMastery:state.callingMastery,
    callingLastSwitchKey:state.callingLastSwitchKey,
    growthPoints:state.growthPoints,
    purchasedTraits:state.purchasedTraits,
    unlockedBondScenes:state.unlockedBondScenes,
    rewardedBondScenes:state.rewardedBondScenes,
    growthPointBossRewards:state.growthPointBossRewards,
    legendRewardKeys:state.legendRewardKeys,
  };
}
