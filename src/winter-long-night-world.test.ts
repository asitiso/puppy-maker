import { describe, expect, it } from 'vitest';
import type { AutumnChoiceCommitment } from './autumn-major-choice';
import type { WorldHistoryState } from './world-history';
import {
  getWinterLongNightWorldCrisis,
  resolveWinterLongNightWorldConsequence,
} from './winter-long-night-world';

const history = (currentFacts: WorldHistoryState['currentFacts'], inheritedFacts: WorldHistoryState['inheritedFacts'] = []): WorldHistoryState => ({
  currentFacts,
  inheritedFacts,
});

const commitment = (
  campaign: AutumnChoiceCommitment['campaign'],
  optionId: AutumnChoiceCommitment['optionId'],
): AutumnChoiceCommitment => ({
  campaign,
  choiceId: `${campaign}_autumn` as AutumnChoiceCommitment['choiceId'],
  optionId,
});

describe('V3 Winter Long Night World contracts', () => {
  it('builds four distinct fail-forward Long Night crises from committed current-run Autumn history', () => {
    const caretaker = getWinterLongNightWorldCrisis(
      commitment('caretaker', 'team_solution'),
      history(['caretaker_team_solution']),
    );
    const pathfinder = getWinterLongNightWorldCrisis(
      commitment('pathfinder', 'limited_access'),
      history(['ancient_route_limited']),
    );
    const vanguard = getWinterLongNightWorldCrisis(
      commitment('vanguard', 'coalition_command'),
      history(['coalition_command']),
    );
    const arcanist = getWinterLongNightWorldCrisis(
      commitment('arcanist', 'controlled_use'),
      history(['forbidden_relic_controlled']),
    );

    expect(caretaker).toMatchObject({
      eventId: 'long_night', campaign: 'caretaker', stageId: 'forest_guardian',
      pressure: 'preservation_crisis', historyEffect: 'team_coordinated',
      tacticalAdjustment: 'preservation_coordinated', failForward: true,
    });
    expect(pathfinder).toMatchObject({
      eventId: 'long_night', campaign: 'pathfinder', stageId: 'city_core',
      pressure: 'unstable_route', historyEffect: 'route_limited',
      tacticalAdjustment: 'route_phase_weakened', failForward: true,
    });
    expect(vanguard).toMatchObject({
      eventId: 'long_night', campaign: 'vanguard', stageId: 'city_core',
      pressure: 'command_siege', historyEffect: 'coalition_command',
      tacticalAdjustment: 'elite_chain_coalition', failForward: true,
    });
    expect(arcanist).toMatchObject({
      eventId: 'long_night', campaign: 'arcanist', stageId: 'lake_tempest',
      pressure: 'reality_rift_memory', historyEffect: 'forbidden_power_controlled',
      tacticalAdjustment: 'rule_shift_controlled', failForward: true,
    });
  });

  it('maps every registered Autumn choice to a materially distinct Winter adjustment', () => {
    const cases = [
      ['caretaker', 'save_one', 'caretaker_critical_person_saved', 'preservation_harder'],
      ['caretaker', 'spread_risk', 'caretaker_risk_shared', 'preservation_supported'],
      ['caretaker', 'team_solution', 'caretaker_team_solution', 'preservation_coordinated'],
      ['pathfinder', 'open_route', 'ancient_route_opened', 'route_shortcut_unstable'],
      ['pathfinder', 'seal_route', 'ancient_route_sealed', 'route_detour'],
      ['pathfinder', 'limited_access', 'ancient_route_limited', 'route_phase_weakened'],
      ['vanguard', 'centralize', 'eiden_central_command', 'elite_chain_centralized'],
      ['vanguard', 'preserve_independence', 'regional_alliance', 'elite_chain_distributed'],
      ['vanguard', 'coalition_command', 'coalition_command', 'elite_chain_coalition'],
      ['arcanist', 'use_relic', 'forbidden_relic_used', 'rule_shift_empowered_costly'],
      ['arcanist', 'destroy_relic', 'forbidden_relic_destroyed', 'rule_shift_without_relic'],
      ['arcanist', 'controlled_use', 'forbidden_relic_controlled', 'rule_shift_controlled'],
    ] as const;

    for (const [campaign, optionId, fact, adjustment] of cases) {
      const crisis = getWinterLongNightWorldCrisis(
        commitment(campaign, optionId),
        history([fact]),
      );
      expect(crisis?.tacticalAdjustment).toBe(adjustment);
    }
  });

  it('does not let inherited or contradictory history substitute for the committed current-run Autumn fact', () => {
    expect(getWinterLongNightWorldCrisis(
      commitment('pathfinder', 'limited_access'),
      history([], ['ancient_route_limited']),
    )).toBeNull();

    expect(getWinterLongNightWorldCrisis(
      commitment('arcanist', 'controlled_use'),
      history(['forbidden_relic_used']),
    )).toBeNull();
  });

  it('resolves all Long Night outcomes into typed fail-forward World consequences, including defeat', () => {
    expect(resolveWinterLongNightWorldConsequence('caretaker', 'exceptional_victory')).toEqual({
      eventId: 'long_night', campaign: 'caretaker', outcome: 'exceptional_victory',
      consequence: 'night_broken', failForward: true,
    });
    expect(resolveWinterLongNightWorldConsequence('pathfinder', 'victory')?.consequence).toBe('night_endured');
    expect(resolveWinterLongNightWorldConsequence('vanguard', 'costly_victory')?.consequence).toBe('night_survived_at_cost');
    expect(resolveWinterLongNightWorldConsequence('arcanist', 'defeat')).toEqual({
      eventId: 'long_night', campaign: 'arcanist', outcome: 'defeat',
      consequence: 'night_scars_remain', failForward: true,
    });
  });

  it('rejects malformed commitments, history, campaigns, and outcomes without inventing fallback history', () => {
    expect(getWinterLongNightWorldCrisis(null, history([]))).toBeNull();
    expect(getWinterLongNightWorldCrisis(
      { campaign: 'caretaker', choiceId: 'pathfinder_autumn', optionId: 'team_solution' } as AutumnChoiceCommitment,
      history(['caretaker_team_solution']),
    )).toBeNull();
    expect(getWinterLongNightWorldCrisis(
      commitment('caretaker', 'team_solution'),
      { currentFacts: ['unknown_fact'], inheritedFacts: [] } as unknown as WorldHistoryState,
    )).toBeNull();
    expect(resolveWinterLongNightWorldConsequence('unknown', 'victory')).toBeNull();
    expect(resolveWinterLongNightWorldConsequence('caretaker', 'unknown')).toBeNull();
  });
});
