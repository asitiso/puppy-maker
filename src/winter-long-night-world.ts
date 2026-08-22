import {
  mainCampaignIds,
  majorOutcomeResults,
  type MainCampaignId,
  type MajorOutcomeResult,
} from './campaign-model';
import type { AutumnChoiceCommitment } from './autumn-major-choice';
import { getAutumnMajorChoiceWorldFacts } from './autumn-world-consequences';
import type { ExpeditionStageId } from './expedition-regions';
import type { WorldHistoryState } from './world-history';

export type WinterLongNightWorldPressure =
  | 'preservation_crisis'
  | 'unstable_route'
  | 'command_siege'
  | 'reality_rift_memory';

export type WinterLongNightHistoryEffect =
  | 'single_burden'
  | 'responsibility_shared'
  | 'team_coordinated'
  | 'route_opened'
  | 'route_sealed'
  | 'route_limited'
  | 'centralized_command'
  | 'regional_alliance'
  | 'coalition_command'
  | 'forbidden_power_used'
  | 'forbidden_power_destroyed'
  | 'forbidden_power_controlled';

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

export type WinterLongNightWorldConsequenceId =
  | 'night_broken'
  | 'night_endured'
  | 'night_survived_at_cost'
  | 'night_scars_remain';

export type WinterLongNightWorldCrisis = Readonly<{
  eventId: 'long_night';
  campaign: MainCampaignId;
  stageId: ExpeditionStageId;
  pressure: WinterLongNightWorldPressure;
  historyEffect: WinterLongNightHistoryEffect;
  tacticalAdjustment: WinterLongNightTacticalAdjustment;
  failForward: true;
}>;

export type WinterLongNightWorldConsequence = Readonly<{
  eventId: 'long_night';
  campaign: MainCampaignId;
  outcome: MajorOutcomeResult;
  consequence: WinterLongNightWorldConsequenceId;
  failForward: true;
}>;

type CampaignBase = Readonly<{
  stageId: ExpeditionStageId;
  pressure: WinterLongNightWorldPressure;
}>;

type ChoiceEffect = Readonly<{
  historyEffect: WinterLongNightHistoryEffect;
  tacticalAdjustment: WinterLongNightTacticalAdjustment;
}>;

const campaignBase: Readonly<Record<MainCampaignId, CampaignBase>> = {
  caretaker: { stageId: 'forest_guardian', pressure: 'preservation_crisis' },
  pathfinder: { stageId: 'city_core', pressure: 'unstable_route' },
  vanguard: { stageId: 'city_core', pressure: 'command_siege' },
  arcanist: { stageId: 'lake_tempest', pressure: 'reality_rift_memory' },
};

const choiceEffects: Readonly<Record<string, ChoiceEffect>> = {
  save_one: { historyEffect: 'single_burden', tacticalAdjustment: 'preservation_harder' },
  spread_risk: { historyEffect: 'responsibility_shared', tacticalAdjustment: 'preservation_supported' },
  team_solution: { historyEffect: 'team_coordinated', tacticalAdjustment: 'preservation_coordinated' },
  open_route: { historyEffect: 'route_opened', tacticalAdjustment: 'route_shortcut_unstable' },
  seal_route: { historyEffect: 'route_sealed', tacticalAdjustment: 'route_detour' },
  limited_access: { historyEffect: 'route_limited', tacticalAdjustment: 'route_phase_weakened' },
  centralize: { historyEffect: 'centralized_command', tacticalAdjustment: 'elite_chain_centralized' },
  preserve_independence: { historyEffect: 'regional_alliance', tacticalAdjustment: 'elite_chain_distributed' },
  coalition_command: { historyEffect: 'coalition_command', tacticalAdjustment: 'elite_chain_coalition' },
  use_relic: { historyEffect: 'forbidden_power_used', tacticalAdjustment: 'rule_shift_empowered_costly' },
  destroy_relic: { historyEffect: 'forbidden_power_destroyed', tacticalAdjustment: 'rule_shift_without_relic' },
  controlled_use: { historyEffect: 'forbidden_power_controlled', tacticalAdjustment: 'rule_shift_controlled' },
};

const consequenceByOutcome: Readonly<Record<MajorOutcomeResult, WinterLongNightWorldConsequenceId>> = {
  exceptional_victory: 'night_broken',
  victory: 'night_endured',
  costly_victory: 'night_survived_at_cost',
  defeat: 'night_scars_remain',
};

const isCampaign = (value: unknown): value is MainCampaignId =>
  typeof value === 'string' && (mainCampaignIds as readonly string[]).includes(value);

const isOutcome = (value: unknown): value is MajorOutcomeResult =>
  typeof value === 'string' && (majorOutcomeResults as readonly string[]).includes(value);

export function getWinterLongNightWorldCrisis(
  commitment: AutumnChoiceCommitment | null | undefined,
  worldHistory: WorldHistoryState | null | undefined,
): WinterLongNightWorldCrisis | null {
  if (!commitment || !isCampaign(commitment.campaign) || !worldHistory) return null;
  if (commitment.choiceId !== `${commitment.campaign}_autumn`) return null;
  if (!Array.isArray(worldHistory.currentFacts) || !Array.isArray(worldHistory.inheritedFacts)) return null;

  const expectedFacts = getAutumnMajorChoiceWorldFacts(commitment.campaign, commitment.optionId);
  if (!expectedFacts || expectedFacts.length === 0) return null;
  if (!expectedFacts.every(fact => worldHistory.currentFacts.includes(fact))) return null;

  const effect = choiceEffects[commitment.optionId];
  if (!effect) return null;
  const base = campaignBase[commitment.campaign];

  return {
    eventId: 'long_night',
    campaign: commitment.campaign,
    stageId: base.stageId,
    pressure: base.pressure,
    historyEffect: effect.historyEffect,
    tacticalAdjustment: effect.tacticalAdjustment,
    failForward: true,
  };
}

export function resolveWinterLongNightWorldConsequence(
  campaign: unknown,
  outcome: unknown,
): WinterLongNightWorldConsequence | null {
  if (!isCampaign(campaign) || !isOutcome(outcome)) return null;
  return {
    eventId: 'long_night',
    campaign,
    outcome,
    consequence: consequenceByOutcome[outcome],
    failForward: true,
  };
}
