import type { MajorOutcomeResult } from './campaign-model';
import {
  getSummerGuardianFestivalWorldRoute,
  type SummerGuardianFestivalWorldRoute,
} from './summer-campaign-world';
import { getSummerGuardianFestivalTacticalClimax } from './summer-tactical-climax';
import type { TacticalScenario, TacticalScenarioResult } from './tactical-scenario';

export function summerWorldRouteToTacticalClimax(
  route: SummerGuardianFestivalWorldRoute,
): TacticalScenario {
  const canonicalRoute = getSummerGuardianFestivalWorldRoute(route?.campaign);
  const climax = getSummerGuardianFestivalTacticalClimax(route?.campaign);
  if (!canonicalRoute || !climax) {
    throw new Error('Summer Lane B requires a registered campaign route');
  }
  if (
    route.identity !== canonicalRoute.identity
    || route.objectiveId !== canonicalRoute.objectiveId
    || route.regionId !== canonicalRoute.regionId
    || route.stageId !== canonicalRoute.stageId
    || route.pressure !== canonicalRoute.pressure
    || route.failForward !== true
  ) {
    throw new Error('Summer World route does not match its canonical campaign route');
  }
  if (climax.campaign !== route.campaign || climax.stageId !== route.stageId || !climax.failForward) {
    throw new Error('Summer World/Tactical route mismatch');
  }
  return climax;
}

export function mapSummerTacticalResultToGuardianFestivalOutcome(
  result: TacticalScenarioResult,
): MajorOutcomeResult {
  if (result.objectiveResult === 'failure') return 'defeat';
  if (result.battleResult !== 'victory') return 'costly_victory';
  if (result.survivingAllies === 3 && result.damageTaken === 0) return 'exceptional_victory';
  return 'victory';
}
