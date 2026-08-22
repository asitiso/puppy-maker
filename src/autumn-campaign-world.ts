import type { MainCampaignId } from './campaign-model';
import {
  buildGreatExpeditionWorldPrerequisite,
  campaignWorldObjectives,
  type CampaignWorldObjectiveId,
  type GreatExpeditionWorldPrerequisiteInput,
} from './campaign-world';
import type { ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';

export type AutumnGreatExpeditionWorldIdentity =
  | 'rescue_resource_sharing'
  | 'ancient_route_traversal'
  | 'coalition_command_pressure'
  | 'forbidden_relic_rift';

export type AutumnGreatExpeditionWorldPressure =
  | 'critical_person_protection'
  | 'limited_action_traversal'
  | 'elite_chain_command'
  | 'relic_rule_shift';

export type AutumnGreatExpeditionWorldRoute = Readonly<{
  eventId: 'great_expedition';
  campaign: MainCampaignId;
  identity: AutumnGreatExpeditionWorldIdentity;
  objectiveId: CampaignWorldObjectiveId;
  regionId: ExpeditionRegionId;
  stageId: ExpeditionStageId;
  pressure: AutumnGreatExpeditionWorldPressure;
  failForward: true;
}>;

const route = (
  campaign: MainCampaignId,
  identity: AutumnGreatExpeditionWorldIdentity,
  objectiveId: CampaignWorldObjectiveId,
  stageId: ExpeditionStageId,
  pressure: AutumnGreatExpeditionWorldPressure,
): AutumnGreatExpeditionWorldRoute => {
  const objective = campaignWorldObjectives.find(candidate => candidate.id === objectiveId);
  if (!objective || objective.season !== 'autumn' || objective.campaign !== campaign) {
    throw new Error('Autumn Great Expedition route requires a matching Autumn World objective');
  }
  if (!objective.stageIds.includes(stageId)) {
    throw new Error('Autumn Great Expedition route must reuse an existing objective stage');
  }
  return {
    eventId: 'great_expedition',
    campaign,
    identity,
    objectiveId,
    regionId: objective.regionId,
    stageId,
    pressure,
    failForward: true,
  };
};

export const autumnGreatExpeditionWorldRoutes: readonly AutumnGreatExpeditionWorldRoute[] = [
  route(
    'caretaker',
    'rescue_resource_sharing',
    'autumn_caretaker_great_expedition_rescue',
    'forest_guardian',
    'critical_person_protection',
  ),
  route(
    'pathfinder',
    'ancient_route_traversal',
    'autumn_pathfinder_great_expedition_route',
    'city_core',
    'limited_action_traversal',
  ),
  route(
    'vanguard',
    'coalition_command_pressure',
    'autumn_vanguard_great_expedition_command',
    'city_core',
    'elite_chain_command',
  ),
  route(
    'arcanist',
    'forbidden_relic_rift',
    'autumn_arcanist_great_expedition_relic',
    'lake_tempest',
    'relic_rule_shift',
  ),
] as const;

export function getAutumnGreatExpeditionWorldRoute(
  campaign: unknown,
  prerequisiteInput: GreatExpeditionWorldPrerequisiteInput | null,
): AutumnGreatExpeditionWorldRoute | null {
  if (typeof campaign !== 'string' || !prerequisiteInput) return null;
  const prerequisite = buildGreatExpeditionWorldPrerequisite(prerequisiteInput);
  if (!prerequisite.ready || prerequisite.campaign !== campaign) return null;
  return autumnGreatExpeditionWorldRoutes.find(route => route.campaign === campaign) ?? null;
}
