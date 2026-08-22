import type { MainCampaignId } from './campaign-model';
import type { WorldFactId } from './world-history';

const consequenceFacts: Readonly<Record<MainCampaignId, Readonly<Record<string, readonly WorldFactId[]>>>> = {
  caretaker: {
    save_one: ['caretaker_critical_person_saved'],
    spread_risk: ['caretaker_risk_shared'],
    team_solution: ['caretaker_team_solution'],
  },
  pathfinder: {
    open_route: ['ancient_route_opened'],
    seal_route: ['ancient_route_sealed'],
    limited_access: ['ancient_route_limited'],
  },
  vanguard: {
    centralize: ['eiden_central_command'],
    preserve_independence: ['regional_alliance'],
    coalition_command: ['coalition_command'],
  },
  arcanist: {
    use_relic: ['forbidden_relic_used'],
    destroy_relic: ['forbidden_relic_destroyed'],
    controlled_use: ['forbidden_relic_controlled'],
  },
};

export function getAutumnMajorChoiceWorldFacts(
  campaign: unknown,
  choice: unknown,
): readonly WorldFactId[] | null {
  if (typeof campaign !== 'string' || typeof choice !== 'string') return null;
  if (!(campaign in consequenceFacts)) return null;
  const facts = consequenceFacts[campaign as MainCampaignId][choice];
  return facts ? [...facts] : null;
}
