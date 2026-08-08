import type { CraftingMilestoneId } from './expedition-crafting';
import type { ExpeditionDiscoveryId } from './expedition-discoveries';
import { expeditionRegionDefinitions, expeditionStageDefinitions, type ExpeditionStageId, type ExpeditionStageRecord } from './expedition-regions';
import type { ExpeditionRelicId } from './expedition-relics';
import { guardianEvolution, type GuardianEvolutionId } from './guardian-evolution';
import type { GuardianLegacyId } from './guardian-legacy';
import type { GuardianRankId } from './guardian-rank';

export type ExpeditionArchiveProgress = {
  expeditionStages: number;
  expeditionBosses: number;
  expeditionRelics: number;
  expeditionStories: number;
  expeditionDiscoveries: number;
  guardianEvolution: number;
  expeditionCrafting: number;
  expeditionRegions: number;
  expeditionSMilestones: number;
};

export type ExpeditionArchiveProgressInput = {
  baseArchiveCurrent: number;
  records: Record<ExpeditionStageId, ExpeditionStageRecord>;
  ownedRelics: ExpeditionRelicId[];
  storyEntries: ExpeditionStageId[];
  discoveries: ExpeditionDiscoveryId[];
  craftingMilestones: CraftingMilestoneId[];
  guardianRank: GuardianRankId;
  legacyId: GuardianLegacyId;
};

const evolutionOrder: GuardianEvolutionId[] = ['apprentice','guardian','star_guardian','legendary_guardian'];

function cleared(record: ExpeditionStageRecord) {
  return record.cleared || record.bestGrade === 'S' || record.bestGrade === 'A' || record.bestGrade === 'B';
}

export function expeditionArchiveProgress(input: ExpeditionArchiveProgressInput): ExpeditionArchiveProgress {
  const expeditionStages = expeditionStageDefinitions.filter(stage => cleared(input.records[stage.id])).length;
  const expeditionBosses = expeditionStageDefinitions.filter(stage => stage.boss && cleared(input.records[stage.id])).length;
  const expeditionRelics = new Set(input.ownedRelics).size;
  const expeditionStories = new Set(input.storyEntries).size;
  const expeditionDiscoveries = new Set(input.discoveries).size;
  const expeditionCrafting = new Set(input.craftingMilestones).size;
  const expeditionRegions = expeditionRegionDefinitions.filter(region => region.stages.every(id => cleared(input.records[id]))).length;
  const expeditionSMilestones = expeditionRegionDefinitions.filter(region => region.stages.every(id => input.records[id].bestGrade === 'S')).length;
  const allStagesS = expeditionSMilestones === expeditionRegionDefinitions.length;

  const withoutEvolution = Math.max(0, Math.floor(input.baseArchiveCurrent))
    + expeditionStages + expeditionBosses + expeditionRelics + expeditionStories
    + expeditionDiscoveries + expeditionCrafting + expeditionRegions + expeditionSMilestones;

  let guardianEvolutionCount = 1;
  for (let pass = 0; pass < evolutionOrder.length; pass += 1) {
    const id = guardianEvolution({
      guardianRank: input.guardianRank,
      bossClears: expeditionBosses,
      allStagesS,
      archiveCurrent: withoutEvolution + guardianEvolutionCount,
      legacyId: input.legacyId,
    });
    const nextCount = evolutionOrder.indexOf(id) + 1;
    if (nextCount === guardianEvolutionCount) break;
    guardianEvolutionCount = nextCount;
  }

  return {
    expeditionStages,
    expeditionBosses,
    expeditionRelics,
    expeditionStories,
    expeditionDiscoveries,
    guardianEvolution: guardianEvolutionCount,
    expeditionCrafting,
    expeditionRegions,
    expeditionSMilestones,
  };
}
