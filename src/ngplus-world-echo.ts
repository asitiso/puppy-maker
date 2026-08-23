import type { MainCampaignId } from './campaign-model';
import type { NgPlusUnlockId } from './legacy-state';
import type { WorldFactId, WorldHistoryState } from './world-history';

export type NgPlusWorldEchoEffect =
  | 'flavor'
  | 'starting_event'
  | 'hidden_quest'
  | 'candidate_rationale'
  | 'reward';

export type NgPlusWorldEchoDefinition = Readonly<{
  effect: NgPlusWorldEchoEffect;
  campaign: MainCampaignId | null;
  presentationKey: string;
  affectsNormalCampaignAccess: false;
}>;

export type NgPlusWorldEchoPresentationEntry = NgPlusWorldEchoDefinition & Readonly<{
  factId: WorldFactId;
  source: 'inherited';
}>;

export type NgPlusWorldEchoPresentation = Readonly<{
  currentFacts: WorldFactId[];
  inheritedEchoes: NgPlusWorldEchoPresentationEntry[];
  normalCampaignAccessAffected: false;
}>;

const echo = (
  factId: WorldFactId,
  effect: NgPlusWorldEchoEffect,
  campaign: MainCampaignId | null,
): NgPlusWorldEchoDefinition => ({
  effect,
  campaign,
  presentationKey: `ngplus.world_echo.${factId}`,
  affectsNormalCampaignAccess: false,
});

export const ngPlusWorldEchoDefinitions: Readonly<Record<WorldFactId, NgPlusWorldEchoDefinition>> = {
  festival_saved: echo('festival_saved', 'starting_event', null),
  festival_heavy_losses: echo('festival_heavy_losses', 'flavor', null),

  ancient_route_opened: echo('ancient_route_opened', 'candidate_rationale', 'pathfinder'),
  ancient_route_sealed: echo('ancient_route_sealed', 'candidate_rationale', 'pathfinder'),
  ancient_route_limited: echo('ancient_route_limited', 'candidate_rationale', 'pathfinder'),

  eiden_central_command: echo('eiden_central_command', 'candidate_rationale', 'vanguard'),
  regional_alliance: echo('regional_alliance', 'candidate_rationale', 'vanguard'),
  coalition_command: echo('coalition_command', 'candidate_rationale', 'vanguard'),

  forbidden_relic_used: echo('forbidden_relic_used', 'hidden_quest', 'arcanist'),
  forbidden_relic_destroyed: echo('forbidden_relic_destroyed', 'hidden_quest', 'arcanist'),
  forbidden_relic_controlled: echo('forbidden_relic_controlled', 'hidden_quest', 'arcanist'),
  rift_stabilized: echo('rift_stabilized', 'hidden_quest', 'arcanist'),
  rift_unstable: echo('rift_unstable', 'hidden_quest', 'arcanist'),

  caretaker_critical_person_saved: echo('caretaker_critical_person_saved', 'reward', 'caretaker'),
  caretaker_risk_shared: echo('caretaker_risk_shared', 'reward', 'caretaker'),
  caretaker_team_solution: echo('caretaker_team_solution', 'reward', 'caretaker'),

  true_path_echoes_aligned: echo('true_path_echoes_aligned', 'flavor', null),
  true_path_world_rewoven: echo('true_path_world_rewoven', 'starting_event', null),
  true_path_cycle_rejoined: echo('true_path_cycle_rejoined', 'hidden_quest', null),
  true_path_cost_borne: echo('true_path_cost_borne', 'flavor', null),
};

export function buildNgPlusWorldEchoPresentation(
  worldHistory: WorldHistoryState,
  unlocks: readonly NgPlusUnlockId[],
): NgPlusWorldEchoPresentation {
  const inheritedEchoes = unlocks.includes('world_echo')
    ? worldHistory.inheritedFacts.map(factId => ({
        factId,
        source: 'inherited' as const,
        ...ngPlusWorldEchoDefinitions[factId],
      }))
    : [];

  return {
    currentFacts: [...worldHistory.currentFacts],
    inheritedEchoes,
    normalCampaignAccessAffected: false,
  };
}
