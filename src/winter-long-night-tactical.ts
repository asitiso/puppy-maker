import type { MainCampaignId } from './campaign-model';
import {
  campaignEncounterToTacticalScenario,
  type CampaignEncounterDefinition,
  type TacticalScenario,
} from './tactical-scenario';

export type WinterLongNightTacticalAdjustment =
  | 'preservation_harder'
  | 'preservation_supported'
  | 'preservation_coordinated'
  | 'route_shortcut_unstable'
  | 'route_detour'
  | 'route_phase_weakened'
  | 'elite_chain_centralized'
  | 'elite_chain_distributed'
  | 'elite_chain_coalition'
  | 'rule_shift_empowered_costly'
  | 'rule_shift_without_relic'
  | 'rule_shift_controlled';

export type WinterLongNightTacticalInput = Readonly<{
  eventId: 'long_night';
  campaign: MainCampaignId;
  stageId: string;
  tacticalAdjustment: WinterLongNightTacticalAdjustment;
  failForward: boolean;
}>;

const expectedStage: Readonly<Record<MainCampaignId, string>> = {
  caretaker: 'forest_guardian',
  pathfinder: 'city_core',
  vanguard: 'city_core',
  arcanist: 'lake_tempest',
};

function encounterFor(input: WinterLongNightTacticalInput): CampaignEncounterDefinition {
  if (input.eventId !== 'long_night' || input.failForward !== true || expectedStage[input.campaign] !== input.stageId) {
    throw new Error('Invalid Winter Long Night Tactical input');
  }

  switch (input.tacticalAdjustment) {
    case 'preservation_harder':
      if (input.campaign !== 'caretaker') break;
      return {
        id: 'winter-long-night:caretaker:preservation-harder', campaign: 'caretaker', stageId: input.stageId,
        objective: { type: 'survive', rounds: 6 },
        modifiers: [
          { campaign: 'caretaker', kind: 'rescue', unitId: 'long-night-critical-person' },
          { campaign: 'caretaker', kind: 'survive', rounds: 6 },
        ], failForward: true,
      };
    case 'preservation_supported':
      if (input.campaign !== 'caretaker') break;
      return {
        id: 'winter-long-night:caretaker:preservation-supported', campaign: 'caretaker', stageId: input.stageId,
        objective: { type: 'survive', rounds: 5 },
        modifiers: [
          { campaign: 'caretaker', kind: 'rescue', unitId: 'long-night-critical-person' },
          { campaign: 'caretaker', kind: 'survive', rounds: 5 },
        ], failForward: true,
      };
    case 'preservation_coordinated':
      if (input.campaign !== 'caretaker') break;
      return {
        id: 'winter-long-night:caretaker:preservation-coordinated', campaign: 'caretaker', stageId: input.stageId,
        objective: { type: 'survive', rounds: 4 },
        modifiers: [
          { campaign: 'caretaker', kind: 'rescue', unitId: 'long-night-critical-person' },
          { campaign: 'caretaker', kind: 'survive', rounds: 4 },
        ], failForward: true,
      };
    case 'route_shortcut_unstable':
      if (input.campaign !== 'pathfinder') break;
      return {
        id: 'winter-long-night:pathfinder:shortcut-unstable', campaign: 'pathfinder', stageId: input.stageId,
        objective: { type: 'escape', afterRounds: 2 },
        modifiers: [
          { campaign: 'pathfinder', kind: 'scout', revealCount: 1 },
          { campaign: 'pathfinder', kind: 'turn-limit', maxRounds: 4 },
          { campaign: 'pathfinder', kind: 'escape', afterRounds: 2 },
        ], failForward: true,
      };
    case 'route_detour':
      if (input.campaign !== 'pathfinder') break;
      return {
        id: 'winter-long-night:pathfinder:detour', campaign: 'pathfinder', stageId: input.stageId,
        objective: { type: 'escape', afterRounds: 4 },
        modifiers: [
          { campaign: 'pathfinder', kind: 'scout', revealCount: 1 },
          { campaign: 'pathfinder', kind: 'turn-limit', maxRounds: 7 },
          { campaign: 'pathfinder', kind: 'escape', afterRounds: 4 },
        ], failForward: true,
      };
    case 'route_phase_weakened':
      if (input.campaign !== 'pathfinder') break;
      return {
        id: 'winter-long-night:pathfinder:phase-weakened', campaign: 'pathfinder', stageId: input.stageId,
        objective: { type: 'escape', afterRounds: 1 },
        modifiers: [
          { campaign: 'pathfinder', kind: 'scout', revealCount: 2 },
          { campaign: 'pathfinder', kind: 'turn-limit', maxRounds: 5 },
          { campaign: 'pathfinder', kind: 'escape', afterRounds: 1 },
        ], failForward: true,
      };
    case 'elite_chain_centralized':
      if (input.campaign !== 'vanguard') break;
      return {
        id: 'winter-long-night:vanguard:centralized', campaign: 'vanguard', stageId: input.stageId,
        objective: { type: 'target-elimination', targetId: `${input.stageId}-enemy-1` },
        modifiers: [
          { campaign: 'vanguard', kind: 'elite', levelBonus: 5 },
          { campaign: 'vanguard', kind: 'chained-battle', chainId: 'long-night-command-siege', index: 4, total: 4 },
        ], failForward: true,
      };
    case 'elite_chain_distributed':
      if (input.campaign !== 'vanguard') break;
      return {
        id: 'winter-long-night:vanguard:distributed', campaign: 'vanguard', stageId: input.stageId,
        objective: { type: 'target-elimination', targetId: `${input.stageId}-enemy-1` },
        modifiers: [
          { campaign: 'vanguard', kind: 'elite', levelBonus: 4 },
          { campaign: 'vanguard', kind: 'chained-battle', chainId: 'long-night-command-siege', index: 3, total: 4 },
        ], failForward: true,
      };
    case 'elite_chain_coalition':
      if (input.campaign !== 'vanguard') break;
      return {
        id: 'winter-long-night:vanguard:coalition', campaign: 'vanguard', stageId: input.stageId,
        objective: { type: 'target-elimination', targetId: `${input.stageId}-enemy-1` },
        modifiers: [
          { campaign: 'vanguard', kind: 'elite', levelBonus: 3 },
          { campaign: 'vanguard', kind: 'chained-battle', chainId: 'long-night-command-siege', index: 2, total: 4 },
        ], failForward: true,
      };
    case 'rule_shift_empowered_costly':
      if (input.campaign !== 'arcanist') break;
      return {
        id: 'winter-long-night:arcanist:empowered-costly', campaign: 'arcanist', stageId: input.stageId,
        objective: { type: 'standard' },
        modifiers: [
          { campaign: 'arcanist', kind: 'relic-resonance', relicId: 'forbidden-long-night-relic' },
          { campaign: 'arcanist', kind: 'status-amplify', statusId: 'break', multiplier: 2 },
          { campaign: 'arcanist', kind: 'rule-shift', ruleId: 'long-night-empowered-costly' },
        ], failForward: true,
      };
    case 'rule_shift_without_relic':
      if (input.campaign !== 'arcanist') break;
      return {
        id: 'winter-long-night:arcanist:without-relic', campaign: 'arcanist', stageId: input.stageId,
        objective: { type: 'standard' },
        modifiers: [
          { campaign: 'arcanist', kind: 'status-amplify', statusId: 'break', multiplier: 1.5 },
          { campaign: 'arcanist', kind: 'rule-shift', ruleId: 'long-night-without-relic' },
        ], failForward: true,
      };
    case 'rule_shift_controlled':
      if (input.campaign !== 'arcanist') break;
      return {
        id: 'winter-long-night:arcanist:controlled', campaign: 'arcanist', stageId: input.stageId,
        objective: { type: 'standard' },
        modifiers: [
          { campaign: 'arcanist', kind: 'relic-resonance', relicId: 'controlled-long-night-relic' },
          { campaign: 'arcanist', kind: 'status-amplify', statusId: 'break', multiplier: 1.25 },
          { campaign: 'arcanist', kind: 'rule-shift', ruleId: 'long-night-controlled' },
        ], failForward: true,
      };
  }

  throw new Error('Winter Long Night Tactical adjustment/campaign mismatch');
}

export function winterLongNightTacticalScenario(input: WinterLongNightTacticalInput): TacticalScenario {
  return campaignEncounterToTacticalScenario(encounterFor(input));
}
