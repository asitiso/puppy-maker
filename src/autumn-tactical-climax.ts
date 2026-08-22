import type { MainCampaignId } from './campaign-model';
import {
  campaignEncounterToTacticalScenario,
  type CampaignEncounterDefinition,
  type TacticalScenario,
} from './tactical-scenario';

const definitions: readonly CampaignEncounterDefinition[] = [
  {
    id: 'autumn-great-expedition:caretaker',
    campaign: 'caretaker',
    stageId: 'forest_guardian',
    objective: { type: 'survive', rounds: 4 },
    modifiers: [
      { campaign: 'caretaker', kind: 'rescue', unitId: 'great-expedition-critical-person' },
      { campaign: 'caretaker', kind: 'survive', rounds: 4 },
    ],
    failForward: true,
  },
  {
    id: 'autumn-great-expedition:pathfinder',
    campaign: 'pathfinder',
    stageId: 'city_core',
    objective: { type: 'escape', afterRounds: 3 },
    modifiers: [
      { campaign: 'pathfinder', kind: 'scout', revealCount: 2 },
      { campaign: 'pathfinder', kind: 'turn-limit', maxRounds: 6 },
      { campaign: 'pathfinder', kind: 'escape', afterRounds: 3 },
    ],
    failForward: true,
  },
  {
    id: 'autumn-great-expedition:vanguard',
    campaign: 'vanguard',
    stageId: 'city_core',
    objective: { type: 'target-elimination', targetId: 'city_core-enemy-1' },
    modifiers: [
      { campaign: 'vanguard', kind: 'elite', levelBonus: 3 },
      {
        campaign: 'vanguard',
        kind: 'chained-battle',
        chainId: 'great-expedition-command-front',
        index: 3,
        total: 3,
      },
    ],
    failForward: true,
  },
  {
    id: 'autumn-great-expedition:arcanist',
    campaign: 'arcanist',
    stageId: 'lake_tempest',
    objective: { type: 'standard' },
    modifiers: [
      { campaign: 'arcanist', kind: 'relic-resonance', relicId: 'forbidden-great-expedition-relic' },
      { campaign: 'arcanist', kind: 'status-amplify', statusId: 'break', multiplier: 1.75 },
      { campaign: 'arcanist', kind: 'rule-shift', ruleId: 'great-expedition-rift-shift' },
    ],
    failForward: true,
  },
] as const;

export const autumnGreatExpeditionTacticalClimaxes: readonly TacticalScenario[] =
  definitions.map(campaignEncounterToTacticalScenario);

export function getAutumnGreatExpeditionTacticalClimax(
  campaign: unknown,
): TacticalScenario | null {
  if (typeof campaign !== 'string') return null;
  return autumnGreatExpeditionTacticalClimaxes.find(
    climax => climax.campaign === (campaign as MainCampaignId),
  ) ?? null;
}
