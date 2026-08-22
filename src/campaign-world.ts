import {
  mainCampaignIds,
  majorEventIds,
  majorOutcomeResults,
  type MainCampaignId,
  type MajorEventId,
  type MajorOutcomeResult,
} from './campaign-model';
import type { ExpeditionRegionId, ExpeditionStageId } from './expedition-regions';
import { isV3Record, uniqueRegistered } from './v3-state-sanitize';
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

function isMajorOutcomeResult(value: unknown): value is MajorOutcomeResult {
  return typeof value === 'string' && majorOutcomeResults.includes(value as MajorOutcomeResult);
}

function isMainCampaignId(value: unknown): value is MainCampaignId {
  return typeof value === 'string' && mainCampaignIds.includes(value as MainCampaignId);
}

function sanitizeMajorOutcomes(raw: unknown): Partial<Record<MajorEventId, MajorOutcomeResult>> {
  if (!isV3Record(raw)) return {};
  const result: Partial<Record<MajorEventId, MajorOutcomeResult>> = {};
  for (const eventId of majorEventIds) {
    const value = raw[eventId];
    if (isMajorOutcomeResult(value)) result[eventId] = value;
  }
  return result;
}

function guardianFestivalFact(outcome: MajorOutcomeResult): WorldFactId {
  return outcome === 'exceptional_victory' || outcome === 'victory'
    ? 'festival_saved'
    : 'festival_heavy_losses';
}

export type GuardianFestivalWorldOutcomeInput = {
  outcome: unknown;
  worldHistory: unknown;
  majorOutcomes: unknown;
  failForwardOutcomes: unknown;
};

export type GuardianFestivalWorldOutcomeResult = {
  applied: boolean;
  eventId: 'guardian_festival';
  outcome: MajorOutcomeResult | null;
  fact: WorldFactId | null;
  worldHistory: WorldHistoryState;
  majorOutcomes: Partial<Record<MajorEventId, MajorOutcomeResult>>;
  failForwardOutcomes: MajorEventId[];
};

export function resolveGuardianFestivalWorldOutcome(
  input: GuardianFestivalWorldOutcomeInput,
): GuardianFestivalWorldOutcomeResult {
  let worldHistory = sanitizeCampaignWorldFacts(input.worldHistory);
  const majorOutcomes = sanitizeMajorOutcomes(input.majorOutcomes);
  let failForwardOutcomes = uniqueRegistered(input.failForwardOutcomes, majorEventIds);
  const existing = majorOutcomes.guardian_festival;

  if (existing) {
    const fact = guardianFestivalFact(existing);
    worldHistory = {
      ...worldHistory,
      currentFacts: sanitizeWorldFactIds([...worldHistory.currentFacts, fact]),
    };
    return {
      applied: false,
      eventId: 'guardian_festival',
      outcome: existing,
      fact,
      worldHistory,
      majorOutcomes,
      failForwardOutcomes,
    };
  }

  if (!isMajorOutcomeResult(input.outcome)) {
    return {
      applied: false,
      eventId: 'guardian_festival',
      outcome: null,
      fact: null,
      worldHistory,
      majorOutcomes,
      failForwardOutcomes,
    };
  }

  const outcome = input.outcome;
  const fact = guardianFestivalFact(outcome);
  worldHistory = {
    ...worldHistory,
    currentFacts: sanitizeWorldFactIds([...worldHistory.currentFacts, fact]),
  };
  majorOutcomes.guardian_festival = outcome;
  if (outcome === 'costly_victory' || outcome === 'defeat') {
    failForwardOutcomes = uniqueRegistered(
      [...failForwardOutcomes, 'guardian_festival'],
      majorEventIds,
    );
  }

  return {
    applied: true,
    eventId: 'guardian_festival',
    outcome,
    fact,
    worldHistory,
    majorOutcomes,
    failForwardOutcomes,
  };
}

export type GreatExpeditionWorldPrerequisiteInput = {
  activeCampaign: unknown;
  worldHistory: unknown;
  majorOutcomes: unknown;
  failForwardOutcomes: unknown;
};

export type GreatExpeditionWorldPrerequisite = {
  campaign: MainCampaignId | null;
  ready: boolean;
  guardianFestivalOutcome: MajorOutcomeResult | null;
  festivalFailForward: boolean;
  currentFacts: WorldFactId[];
  inheritedFacts: WorldFactId[];
};

export function buildGreatExpeditionWorldPrerequisite(
  input: GreatExpeditionWorldPrerequisiteInput,
): GreatExpeditionWorldPrerequisite {
  const campaign = isMainCampaignId(input.activeCampaign) ? input.activeCampaign : null;
  const worldHistory = sanitizeCampaignWorldFacts(input.worldHistory);
  const majorOutcomes = sanitizeMajorOutcomes(input.majorOutcomes);
  const failForwardOutcomes = uniqueRegistered(input.failForwardOutcomes, majorEventIds);
  const guardianFestivalOutcome = majorOutcomes.guardian_festival ?? null;

  return {
    campaign,
    ready: campaign !== null && guardianFestivalOutcome !== null,
    guardianFestivalOutcome,
    festivalFailForward: failForwardOutcomes.includes('guardian_festival'),
    currentFacts: worldHistory.currentFacts,
    inheritedFacts: worldHistory.inheritedFacts,
  };
}
