import type { ExpeditionMaterialId } from './expedition-crafting';
import { expeditionStageDefinitions, type ExpeditionGrade, type ExpeditionStageId } from './expedition-regions';
import { activeCallingTraits, type GrowthTraitId } from './growth-traits';
import type { GuardianCallingId } from './guardian-callings';

export type ExpeditionIdentityModifiers = { attack:number; charge:number; dodge:number };

export function expeditionIdentityModifiers(calling:GuardianCallingId | null, purchased:GrowthTraitId[]): ExpeditionIdentityModifiers {
  const active = new Set(activeCallingTraits(calling, purchased));
  return {
    attack:active.has('vanguard_assault') ? 0.05 : 0,
    charge:active.has('arcanist_channel') ? 0.05 : 0,
    dodge:active.has('caretaker_guard') ? 0.05 : 0,
  };
}

const materialByRegion = {
  starlight_forest:'star_bark',
  ancient_city:'arcane_shard',
  wind_lakes:'wind_pearl',
} as const satisfies Record<string, ExpeditionMaterialId>;

export function pathfinderSupplyBonus(
  calling:GuardianCallingId | null,
  purchased:GrowthTraitId[],
  stageId:ExpeditionStageId,
  grade:ExpeditionGrade,
): ExpeditionMaterialId | null {
  if (grade !== 'S') return null;
  const active = new Set(activeCallingTraits(calling, purchased));
  if (!active.has('pathfinder_supply')) return null;
  const stage = expeditionStageDefinitions.find(item => item.id === stageId);
  return stage ? materialByRegion[stage.region] : null;
}
