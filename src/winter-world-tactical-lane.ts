import type { MajorOutcomeResult } from './campaign-model';
import type { WinterLongNightWorldCrisis } from './winter-long-night-world';
import { winterLongNightTacticalScenario } from './winter-long-night-tactical';
import type { TacticalScenario, TacticalScenarioResult } from './tactical-scenario';

export function winterLongNightWorldCrisisToTacticalScenario(
  crisis: WinterLongNightWorldCrisis,
): TacticalScenario {
  return winterLongNightTacticalScenario(crisis);
}

export function mapWinterTacticalResultToMajorOutcome(
  result: TacticalScenarioResult,
): MajorOutcomeResult {
  if (result.objectiveResult === 'failure' || result.battleResult === 'defeat') return 'defeat';
  if (result.battleResult === 'victory') {
    return result.survivingAllies === 3 && result.damageTaken === 0
      ? 'exceptional_victory'
      : 'victory';
  }
  return 'costly_victory';
}
