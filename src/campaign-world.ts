import type { MainCampaignId } from './campaign-model';
import type { ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';
import { uniqueRegistered } from './v3-state-sanitize';
import {
  hydrateWorldHistoryState,
  worldFactIds,
  type WorldFactId,
  type WorldHistoryState,
} from './world-history';

export type CampaignWorldSeason = 'spring' | 'summer';
export type CampaignWorldObjectiveKind =
  | 'protect_residents'
  | 'discover_route'
  | 'remove_threat'
  | 'investigate_relic_rift';

export type CampaignWorldObjectiveId =
  | 'spring_caretaker_resident_guard'
  | 'spring_pathfinder_hidden_route'
  | 'spring_vanguard_threat_clear'
  | 'spring_arcanist_relic_survey'
  | 'summer_caretaker_festival_rescue'
  | 'summer_pathfinder_festival_routes'
  | 'summer_vanguard_festival_threat'
  | 'summer_arcanist_festival_relic';

export type CampaignWorldObjectiveDefinition = {
  id: CampaignWorldObjectiveId;
  season: CampaignWorldSeason;
  campaign: MainCampaignId;
  kind: CampaignWorldObjectiveKind;
  regionId: ExpeditionRegionId;
  stageIds: readonly ExpeditionStageId[];
};

export const campaignWorldObjectives: readonly CampaignWorldObjectiveDefinition[] = [
  {
    id: 'spring_caretaker_resident_guard',
    season: 'spring',
    campaign: 'caretaker',
    kind: 'protect_residents',
    regionId: 'starlight_forest',
    stageIds: ['forest_path', 'forest_glade'],
  },
  {
    id: 'spring_pathfinder_hidden_route',
    season: 'spring',
    campaign: 'pathfinder',
    kind: 'discover_route',
    regionId: 'ancient_city',
    stageIds: ['city_square', 'city_gallery'],
  },
  {
    id: 'spring_vanguard_threat_clear',
    season: 'spring',
    campaign: 'vanguard',
    kind: 'remove_threat',
    regionId: 'wind_lakes',
    stageIds: ['lake_channel', 'lake_cliff'],
  },
  {
    id: 'spring_arcanist_relic_survey',
    season: 'spring',
    campaign: 'arcanist',
    kind: 'investigate_relic_rift',
    regionId: 'ancient_city',
    stageIds: ['city_gallery', 'city_core'],
  },
  {
    id: 'summer_caretaker_festival_rescue',
    season: 'summer',
    campaign: 'caretaker',
    kind: 'protect_residents',
    regionId: 'starlight_forest',
    stageIds: ['forest_glade', 'forest_guardian'],
  },
  {
    id: 'summer_pathfinder_festival_routes',
    season: 'summer',
    campaign: 'pathfinder',
    kind: 'discover_route',
    regionId: 'ancient_city',
    stageIds: ['city_square', 'city_gallery'],
  },
  {
    id: 'summer_vanguard_festival_threat',
    season: 'summer',
    campaign: 'vanguard',
    kind: 'remove_threat',
    regionId: 'ancient_city',
    stageIds: ['city_square', 'city_core'],
  },
  {
    id: 'summer_arcanist_festival_relic',
    season: 'summer',
    campaign: 'arcanist',
    kind: 'investigate_relic_rift',
    regionId: 'wind_lakes',
    stageIds: ['lake_cliff', 'lake_tempest'],
  },
] as const;

export function sanitizeWorldFactIds(raw: unknown): WorldFactId[] {
  return uniqueRegistered(raw, worldFactIds);
}

export function sanitizeCampaignWorldFacts(raw: unknown): WorldHistoryState {
  return hydrateWorldHistoryState(raw);
}
