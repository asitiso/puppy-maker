import type { MainCampaignId } from './campaign-model';
import {
  campaignWorldObjectives,
  type CampaignWorldObjectiveId,
} from './campaign-world';
import type { ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';

export type SummerGuardianFestivalWorldIdentity =
  | 'rescue_protection'
  | 'hidden_route_escape'
  | 'grand_tournament'
  | 'relic_resonance';

export type SummerGuardianFestivalWorldPressure =
  | 'civilian_survival'
  | 'escape_traversal'
  | 'elite_chain'
  | 'rule_shift';

export type SummerGuardianFestivalWorldRoute = Readonly<{
  campaign: MainCampaignId;
  identity: SummerGuardianFestivalWorldIdentity;
  objectiveId: CampaignWorldObjectiveId;
  regionId: ExpeditionRegionId;
  stageId: ExpeditionStageId;
  pressure: SummerGuardianFestivalWorldPressure;
  failForward: true;
}>;

const route = (
  campaign: MainCampaignId,
  identity: SummerGuardianFestivalWorldIdentity,
  objectiveId: CampaignWorldObjectiveId,
  stageId: ExpeditionStageId,
  pressure: SummerGuardianFestivalWorldPressure,
): SummerGuardianFestivalWorldRoute => {
  const objective = campaignWorldObjectives.find(candidate => candidate.id === objectiveId);
  if (!objective || objective.season !== 'summer' || objective.campaign !== campaign) {
    throw new Error('Summer Guardian Festival route requires a matching Summer World objective');
  }
  if (!objective.stageIds.includes(stageId)) {
    throw new Error('Summer Guardian Festival route must reuse an existing objective stage');
  }
  return {
    campaign,
    identity,
    objectiveId,
    regionId: objective.regionId,
    stageId,
    pressure,
    failForward: true,
  };
};

export const summerGuardianFestivalWorldRoutes: readonly SummerGuardianFestivalWorldRoute[] = [
  route(
    'caretaker',
    'rescue_protection',
    'summer_caretaker_festival_rescue',
    'forest_guardian',
    'civilian_survival',
  ),
  route(
    'pathfinder',
    'hidden_route_escape',
    'summer_pathfinder_festival_routes',
    'city_gallery',
    'escape_traversal',
  ),
  route(
    'vanguard',
    'grand_tournament',
    'summer_vanguard_festival_threat',
    'city_core',
    'elite_chain',
  ),
  route(
    'arcanist',
    'relic_resonance',
    'summer_arcanist_festival_relic',
    'lake_tempest',
    'rule_shift',
  ),
] as const;

export function getSummerGuardianFestivalWorldRoute(
  campaign: unknown,
): SummerGuardianFestivalWorldRoute | null {
  if (typeof campaign !== 'string') return null;
  return summerGuardianFestivalWorldRoutes.find(route => route.campaign === campaign) ?? null;
}
