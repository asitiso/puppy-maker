import { craftingMilestoneIds, emptyExpeditionMaterials, expeditionMaterialIds, type CraftingMilestoneId, type ExpeditionMaterials } from './expedition-crafting';
import { expeditionDiscoveryIds, type ExpeditionDiscoveryId } from './expedition-discoveries';
import { expeditionRegionDefinitions, expeditionStageDefinitions, emptyExpeditionRecords, type ExpeditionGrade, type ExpeditionRegionId, type ExpeditionStageId, type ExpeditionStageRecord } from './expedition-regions';
import { expeditionRelicIds, type ExpeditionRelicId } from './expedition-relics';

export type ExpeditionPersistentState = {
  expeditionRecords: Record<ExpeditionStageId, ExpeditionStageRecord>;
  expeditionMaterials: ExpeditionMaterials;
  ownedExpeditionRelics: ExpeditionRelicId[];
  equippedExpeditionRelics: ExpeditionRelicId[];
  rewardedExpeditionStages: ExpeditionStageId[];
  rewardedExpeditionRegions: ExpeditionRegionId[];
  expeditionDiscoveries: ExpeditionDiscoveryId[];
  expeditionStoryEntries: ExpeditionStageId[];
  craftingMilestones: CraftingMilestoneId[];
};

const stageIds = expeditionStageDefinitions.map(stage => stage.id);
const regionIds = expeditionRegionDefinitions.map(region => region.id);
const validGrades: ExpeditionGrade[] = ['S', 'A', 'B', 'C'];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function emptyExpeditionPersistentState(): ExpeditionPersistentState {
  return {
    expeditionRecords: emptyExpeditionRecords(),
    expeditionMaterials: emptyExpeditionMaterials(),
    ownedExpeditionRelics: [],
    equippedExpeditionRelics: [],
    rewardedExpeditionStages: [],
    rewardedExpeditionRegions: [],
    expeditionDiscoveries: [],
    expeditionStoryEntries: [],
    craftingMilestones: [],
  };
}

function uniqueAllowed<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set<string>(allowed);
  return [...new Set(raw.filter((value): value is T => typeof value === 'string' && allow.has(value)))];
}

function hydrateRecords(raw: unknown): Record<ExpeditionStageId, ExpeditionStageRecord> {
  const source = isRecord(raw) ? raw : {};
  const fallback = emptyExpeditionRecords();
  const result = { ...fallback };
  for (const id of stageIds) {
    const value = isRecord(source[id]) ? source[id] : {};
    const grade = typeof value.bestGrade === 'string' && validGrades.includes(value.bestGrade as ExpeditionGrade) ? value.bestGrade as ExpeditionGrade : 'C';
    result[id] = {
      bestScore: Math.max(0, Math.floor(finite(value.bestScore, 0))),
      bestGrade: grade,
      cleared: value.cleared === true || grade === 'S' || grade === 'A' || grade === 'B',
    };
  }
  return result;
}

function hydrateMaterials(raw: unknown): ExpeditionMaterials {
  const source = isRecord(raw) ? raw : {};
  const next = emptyExpeditionMaterials();
  for (const id of expeditionMaterialIds) next[id] = Math.max(0, Math.floor(finite(source[id], 0)));
  return next;
}

export function hydrateExpeditionPersistentState(raw: unknown): ExpeditionPersistentState {
  const source = isRecord(raw) ? raw : {};
  const milestones = uniqueAllowed(source.craftingMilestones, craftingMilestoneIds);
  const storedOwned = uniqueAllowed(source.ownedExpeditionRelics, expeditionRelicIds);
  const owned: ExpeditionRelicId[] = milestones.includes('crafted_guardian_thread') && !storedOwned.includes('guardian_thread')
    ? [...storedOwned, 'guardian_thread']
    : storedOwned;
  const equipped = uniqueAllowed(source.equippedExpeditionRelics, expeditionRelicIds).filter(id => owned.includes(id)).slice(0, 3);
  const rewardedExpeditionStages = uniqueAllowed(source.rewardedExpeditionStages, stageIds);
  const expeditionRecords = hydrateRecords(source.expeditionRecords);
  for (const stageId of rewardedExpeditionStages) {
    expeditionRecords[stageId] = { ...expeditionRecords[stageId], cleared: true };
  }
  return {
    expeditionRecords,
    expeditionMaterials: hydrateMaterials(source.expeditionMaterials),
    ownedExpeditionRelics: owned,
    equippedExpeditionRelics: equipped,
    rewardedExpeditionStages,
    rewardedExpeditionRegions: uniqueAllowed(source.rewardedExpeditionRegions, regionIds),
    expeditionDiscoveries: uniqueAllowed(source.expeditionDiscoveries, expeditionDiscoveryIds),
    expeditionStoryEntries: uniqueAllowed(source.expeditionStoryEntries, stageIds),
    craftingMilestones: milestones,
  };
}

export function pickExpeditionPersistentState(state: ExpeditionPersistentState): ExpeditionPersistentState {
  return {
    expeditionRecords: state.expeditionRecords,
    expeditionMaterials: state.expeditionMaterials,
    ownedExpeditionRelics: state.ownedExpeditionRelics,
    equippedExpeditionRelics: state.equippedExpeditionRelics,
    rewardedExpeditionStages: state.rewardedExpeditionStages,
    rewardedExpeditionRegions: state.rewardedExpeditionRegions,
    expeditionDiscoveries: state.expeditionDiscoveries,
    expeditionStoryEntries: state.expeditionStoryEntries,
    craftingMilestones: state.craftingMilestones,
  };
}
