import type { MainCampaignId } from './campaign-model';
import {
  campaignEncounterToTacticalScenario,
  type CampaignEncounterDefinition,
  type TacticalScenario,
} from './tactical-scenario';

const definitions: readonly CampaignEncounterDefinition[] = [
  {
    id: 'summer-guardian-festival:caretaker',
    campaign: 'caretaker',
    stageId: 'forest_guardian',
    objective: { type: 'survive', rounds: 3 },
    modifiers: [
      { campaign: 'caretaker', kind: 'rescue', unitId: 'festival-civilian' },
      { campaign: 'caretaker', kind: 'survive', rounds: 3 },
    ],
    failForward: true,
  },
  {
    id: 'summer-guardian-festival:pathfinder',
    campaign: 'pathfinder',
    stageId: 'city_gallery',
    objective: { type: 'escape', afterRounds: 2 },
    modifiers: [
      { campaign: 'pathfinder', kind: 'scout', revealCount: 2 },
      { campaign: 'pathfinder', kind: 'turn-limit', maxRounds: 5 },
      { campaign: 'pathfinder', kind: 'escape', afterRounds: 2 },
    ],
    failForward: true,
  },
  {
    id: 'summer-guardian-festival:vanguard',
    campaign: 'vanguard',
    stageId: 'city_core',
    objective: { type: 'target-elimination', targetId: 'city_core-enemy-1' },
    modifiers: [
      { campaign: 'vanguard', kind: 'elite', levelBonus: 2 },
      {
        campaign: 'vanguard',
        kind: 'chained-battle',
        chainId: 'guardian-grand-tournament',
        index: 3,
        total: 3,
      },
    ],
    failForward: true,
  },
  {
    id: 'summer-guardian-festival:arcanist',
    campaign: 'arcanist',
    stageId: 'lake_tempest',
    objective: { type: 'standard' },
    modifiers: [
      { campaign: 'arcanist', kind: 'relic-resonance', relicId: 'guardian-festival-relic' },
      { campaign: 'arcanist', kind: 'status-amplify', statusId: 'break', multiplier: 1.5 },
      { campaign: 'arcanist', kind: 'rule-shift', ruleId: 'festival-resonance' },
    ],
    failForward: true,
  },
] as const;

export const summerGuardianFestivalTacticalClimaxes: readonly TacticalScenario[] =
  definitions.map(campaignEncounterToTacticalScenario);

export function getSummerGuardianFestivalTacticalClimax(
  campaign: unknown,
): TacticalScenario | null {
  if (typeof campaign !== 'string') return null;
  return summerGuardianFestivalTacticalClimaxes.find(
    climax => climax.campaign === (campaign as MainCampaignId),
  ) ?? null;
}
