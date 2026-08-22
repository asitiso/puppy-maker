import type { MainCampaignId, MajorOutcomeResult } from './campaign-model';
import type { GreatExpeditionWorldPrerequisite } from './campaign-world';
import type { AutumnGreatExpeditionWorldRoute } from './autumn-campaign-world';
import { getAutumnGreatExpeditionTacticalClimax } from './autumn-tactical-climax';
import type { TacticalScenario, TacticalScenarioResult } from './tactical-scenario';
import type { WorldFactId } from './world-history';

export type GreatExpeditionTacticalEvidence = Readonly<{
  eventId: 'great_expedition';
  campaign: MainCampaignId;
  scenarioId: string;
  outcome: MajorOutcomeResult;
  objectiveResult: TacticalScenarioResult['objectiveResult'];
  battleResult: TacticalScenarioResult['battleResult'];
  failForward: boolean;
  rounds: number;
  survivingAllies: number;
  damageTaken: number;
  currentFacts: WorldFactId[];
  inheritedFacts: WorldFactId[];
  festivalFailForward: boolean;
}>;

export function autumnWorldRouteToTacticalClimax(
  route: AutumnGreatExpeditionWorldRoute,
): TacticalScenario {
  const climax = getAutumnGreatExpeditionTacticalClimax(route.campaign);
  if (!climax || climax.stageId !== route.stageId || !climax.failForward || !route.failForward) {
    throw new Error('Autumn Great Expedition World/Tactical route mismatch');
  }
  return climax;
}

function outcomeFromTacticalResult(result: TacticalScenarioResult): MajorOutcomeResult {
  if (result.objectiveResult === 'failure' || result.battleResult === 'defeat') return 'defeat';
  if (result.battleResult === 'victory') {
    return result.survivingAllies === 3 && result.damageTaken === 0
      ? 'exceptional_victory'
      : 'victory';
  }
  return 'costly_victory';
}

export function greatExpeditionEvidenceFromTacticalResult(
  route: AutumnGreatExpeditionWorldRoute,
  result: TacticalScenarioResult,
  prerequisite: GreatExpeditionWorldPrerequisite,
): GreatExpeditionTacticalEvidence {
  const climax = autumnWorldRouteToTacticalClimax(route);
  if (!prerequisite.ready || prerequisite.campaign !== route.campaign) {
    throw new Error('Autumn Great Expedition prerequisite is not ready for this campaign');
  }
  if (result.campaign !== route.campaign || result.scenarioId !== climax.id) {
    throw new Error('Autumn Great Expedition terminal result does not match the World route');
  }

  const outcome = outcomeFromTacticalResult(result);
  return {
    eventId: 'great_expedition',
    campaign: route.campaign,
    scenarioId: result.scenarioId,
    outcome,
    objectiveResult: result.objectiveResult,
    battleResult: result.battleResult,
    failForward: outcome === 'costly_victory' || outcome === 'defeat',
    rounds: result.rounds,
    survivingAllies: result.survivingAllies,
    damageTaken: result.damageTaken,
    currentFacts: [...prerequisite.currentFacts],
    inheritedFacts: [...prerequisite.inheritedFacts],
    festivalFailForward: prerequisite.festivalFailForward,
  };
}
