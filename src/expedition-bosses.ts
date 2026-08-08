import type { ExpeditionStageId } from './expedition-regions';

export type ExpeditionReward = { gold: number; gems: number };

const bossRewards: Partial<Record<ExpeditionStageId, ExpeditionReward>> = {
  forest_guardian: { gold: 500, gems: 2 },
  city_core: { gold: 700, gems: 3 },
  lake_tempest: { gold: 1000, gems: 5 },
};

export function isBossStage(stageId: ExpeditionStageId): boolean {
  return Object.prototype.hasOwnProperty.call(bossRewards, stageId);
}

export function bossReward(stageId: ExpeditionStageId): ExpeditionReward {
  return bossRewards[stageId] ?? { gold: 0, gems: 0 };
}
