import type { GiftItemId } from './adventure';
import { bossReward, isBossStage } from './expedition-bosses';
import type { ExpeditionMaterialId } from './expedition-crafting';
import { eligibleExpeditionDiscovery } from './expedition-discoveries';
import {
  expeditionGrade,
  expeditionRegionDefinitions,
  expeditionStageDefinitions,
  isExpeditionStageCleared,
  isExpeditionStageUnlocked,
  updateExpeditionRecord,
  type ExpeditionGrade,
  type ExpeditionRegionId,
  type ExpeditionStageId,
} from './expedition-regions';
import { relicModifiers, type ExpeditionRelicId } from './expedition-relics';
import type { ExpeditionPersistentState } from './expedition-state';

export type ExpeditionRewardState = ExpeditionPersistentState & {
  gold: number;
  gems: number;
  affection: number;
  inventory: Record<GiftItemId, number>;
};

export type ExpeditionFinishSummary = {
  accepted: boolean;
  stageId: ExpeditionStageId;
  grade: ExpeditionGrade;
  firstClear: boolean;
  materialReward: number;
  discovery: string | null;
  storyUnlocked: boolean;
  bossBadge: boolean;
  regionCompleted: ExpeditionRegionId | null;
  relicsUnlocked: ExpeditionRelicId[];
  fullCompleted: boolean;
};

const regionMaterial: Record<ExpeditionRegionId, ExpeditionMaterialId> = {
  starlight_forest: 'star_bark',
  ancient_city: 'arcane_shard',
  wind_lakes: 'wind_pearl',
};

const regionRelic: Record<ExpeditionRegionId, ExpeditionRelicId> = {
  starlight_forest: 'moonfang_charm',
  ancient_city: 'mana_prism',
  wind_lakes: 'wind_feather',
};

function addUnique<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items : [...items, value];
}

function stageDefinition(stageId: ExpeditionStageId) {
  const stage = expeditionStageDefinitions.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown expedition stage: ${stageId}`);
  return stage;
}

function regionNowComplete(region: ExpeditionRegionId, records: ExpeditionPersistentState['expeditionRecords']): boolean {
  const definition = expeditionRegionDefinitions.find(item => item.id === region);
  return Boolean(definition?.stages.every(stageId => isExpeditionStageCleared(records[stageId])));
}

function allStagesCleared(records: ExpeditionPersistentState['expeditionRecords']): boolean {
  return expeditionStageDefinitions.every(stage => isExpeditionStageCleared(records[stage.id]));
}

export function resolveExpeditionFinish(state: ExpeditionRewardState, stageId: ExpeditionStageId, score: number): { state: ExpeditionRewardState; summary: ExpeditionFinishSummary } {
  const stage = stageDefinition(stageId);
  const grade = expeditionGrade(score, stage.target);
  const accepted = isExpeditionStageUnlocked(stageId, state.expeditionRecords);
  const rejectedSummary: ExpeditionFinishSummary = {
    accepted: false,
    stageId,
    grade,
    firstClear: false,
    materialReward: 0,
    discovery: null,
    storyUnlocked: false,
    bossBadge: false,
    regionCompleted: null,
    relicsUnlocked: [],
    fullCompleted: false,
  };
  if (!accepted) return { state, summary: rejectedSummary };

  const clearedNow = grade !== 'C';
  const firstClear = clearedNow && !state.rewardedExpeditionStages.includes(stageId);
  const expeditionRecords = updateExpeditionRecord(state.expeditionRecords, stageId, score, stage.target);
  let next: ExpeditionRewardState = { ...state, expeditionRecords };
  const relicsUnlocked: ExpeditionRelicId[] = [];

  let materialReward = 0;
  if (clearedNow && !stage.boss) {
    const modifiers = relicModifiers(state.equippedExpeditionRelics);
    materialReward = (grade === 'S' ? 2 : 1) + modifiers.materialBonus;
    const material = regionMaterial[stage.region];
    next = {
      ...next,
      expeditionMaterials: {
        ...next.expeditionMaterials,
        [material]: next.expeditionMaterials[material] + materialReward,
      },
    };
  }

  let storyUnlocked = false;
  let bossBadge = false;
  if (firstClear) {
    storyUnlocked = !next.expeditionStoryEntries.includes(stageId);
    const firstReward = stage.boss ? bossReward(stageId) : { gold: 150, gems: 0 };
    const affectionBonus = relicModifiers(state.equippedExpeditionRelics).firstClearAffection;
    next = {
      ...next,
      gold: next.gold + firstReward.gold,
      gems: next.gems + firstReward.gems,
      affection: Math.min(100, next.affection + affectionBonus),
      rewardedExpeditionStages: addUnique(next.rewardedExpeditionStages, stageId),
      expeditionStoryEntries: addUnique(next.expeditionStoryEntries, stageId),
    };
    bossBadge = stage.boss;
    if (stageId === 'forest_guardian' && !next.ownedExpeditionRelics.includes('bond_locket')) {
      next = { ...next, ownedExpeditionRelics: [...next.ownedExpeditionRelics, 'bond_locket'] };
      relicsUnlocked.push('bond_locket');
    }
  }

  const discovery = clearedNow ? eligibleExpeditionDiscovery(stageId, grade, next.expeditionDiscoveries) : null;
  if (discovery) next = { ...next, expeditionDiscoveries: [...next.expeditionDiscoveries, discovery] };

  let regionCompleted: ExpeditionRegionId | null = null;
  if (clearedNow && regionNowComplete(stage.region, next.expeditionRecords) && !next.rewardedExpeditionRegions.includes(stage.region)) {
    regionCompleted = stage.region;
    const relic = regionRelic[stage.region];
    const owned = next.ownedExpeditionRelics.includes(relic) ? next.ownedExpeditionRelics : [...next.ownedExpeditionRelics, relic];
    if (!next.ownedExpeditionRelics.includes(relic)) relicsUnlocked.push(relic);
    next = {
      ...next,
      ownedExpeditionRelics: owned,
      rewardedExpeditionRegions: [...next.rewardedExpeditionRegions, stage.region],
    };
  }

  let fullCompleted = false;
  if (allStagesCleared(next.expeditionRecords) && !next.ownedExpeditionRelics.includes('explorer_compass')) {
    fullCompleted = true;
    next = {
      ...next,
      gems: next.gems + 5,
      ownedExpeditionRelics: [...next.ownedExpeditionRelics, 'explorer_compass'],
    };
    relicsUnlocked.push('explorer_compass');
  }

  return {
    state: next,
    summary: {
      accepted: true,
      stageId,
      grade,
      firstClear,
      materialReward,
      discovery,
      storyUnlocked,
      bossBadge,
      regionCompleted,
      relicsUnlocked,
      fullCompleted,
    },
  };
}
