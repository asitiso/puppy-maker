import { describe, expect, it } from 'vitest';
import { getAutumnMajorChoiceWorldFacts } from './autumn-world-consequences';

describe('V3 Autumn typed Major Choice world consequences', () => {
  it('maps every campaign choice to stable typed World facts', () => {
    expect(getAutumnMajorChoiceWorldFacts('caretaker', 'save_one')).toEqual(['caretaker_critical_person_saved']);
    expect(getAutumnMajorChoiceWorldFacts('caretaker', 'spread_risk')).toEqual(['caretaker_risk_shared']);
    expect(getAutumnMajorChoiceWorldFacts('caretaker', 'team_solution')).toEqual(['caretaker_team_solution']);

    expect(getAutumnMajorChoiceWorldFacts('pathfinder', 'open_route')).toEqual(['ancient_route_opened']);
    expect(getAutumnMajorChoiceWorldFacts('pathfinder', 'seal_route')).toEqual(['ancient_route_sealed']);
    expect(getAutumnMajorChoiceWorldFacts('pathfinder', 'limited_access')).toEqual(['ancient_route_limited']);

    expect(getAutumnMajorChoiceWorldFacts('vanguard', 'centralize')).toEqual(['eiden_central_command']);
    expect(getAutumnMajorChoiceWorldFacts('vanguard', 'preserve_independence')).toEqual(['regional_alliance']);
    expect(getAutumnMajorChoiceWorldFacts('vanguard', 'coalition_command')).toEqual(['coalition_command']);

    expect(getAutumnMajorChoiceWorldFacts('arcanist', 'use_relic')).toEqual(['forbidden_relic_used']);
    expect(getAutumnMajorChoiceWorldFacts('arcanist', 'destroy_relic')).toEqual(['forbidden_relic_destroyed']);
    expect(getAutumnMajorChoiceWorldFacts('arcanist', 'controlled_use')).toEqual(['forbidden_relic_controlled']);
  });

  it('rejects malformed and cross-campaign choices instead of inventing fallback history', () => {
    expect(getAutumnMajorChoiceWorldFacts('caretaker', 'open_route')).toBeNull();
    expect(getAutumnMajorChoiceWorldFacts('arcanist', 'team_solution')).toBeNull();
    expect(getAutumnMajorChoiceWorldFacts('not-a-campaign', 'save_one')).toBeNull();
    expect(getAutumnMajorChoiceWorldFacts('caretaker', 'not-a-choice')).toBeNull();
  });
});
