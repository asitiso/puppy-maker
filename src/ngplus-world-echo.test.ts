import { describe, expect, it } from 'vitest';
import type { NgPlusUnlockId } from './legacy-state';
import { worldFactIds, type WorldHistoryState } from './world-history';
import {
  buildNgPlusWorldEchoPresentation,
  ngPlusWorldEchoDefinitions,
} from './ngplus-world-echo';

const unlocked: readonly NgPlusUnlockId[] = ['world_echo'];

const history = (
  currentFacts: WorldHistoryState['currentFacts'],
  inheritedFacts: WorldHistoryState['inheritedFacts'],
): WorldHistoryState => ({ currentFacts, inheritedFacts });

describe('NG+ world echoes', () => {
  it('presents inherited facts as typed echoes without mixing current-run evidence', () => {
    const result = buildNgPlusWorldEchoPresentation(
      history(
        ['festival_saved'],
        ['caretaker_team_solution', 'ancient_route_limited', 'coalition_command', 'forbidden_relic_controlled'],
      ),
      unlocked,
    );

    expect(result.currentFacts).toEqual(['festival_saved']);
    expect(result.inheritedEchoes).toEqual([
      expect.objectContaining({ factId: 'caretaker_team_solution', source: 'inherited', effect: 'reward', campaign: 'caretaker' }),
      expect.objectContaining({ factId: 'ancient_route_limited', source: 'inherited', effect: 'candidate_rationale', campaign: 'pathfinder' }),
      expect.objectContaining({ factId: 'coalition_command', source: 'inherited', effect: 'candidate_rationale', campaign: 'vanguard' }),
      expect.objectContaining({ factId: 'forbidden_relic_controlled', source: 'inherited', effect: 'hidden_quest', campaign: 'arcanist' }),
    ]);
    expect(result.normalCampaignAccessAffected).toBe(false);
  });

  it('does not expose inherited echoes before the world_echo NG+ unlock is active', () => {
    const result = buildNgPlusWorldEchoPresentation(
      history(['festival_saved'], ['ancient_route_opened']),
      [],
    );

    expect(result.currentFacts).toEqual(['festival_saved']);
    expect(result.inheritedEchoes).toEqual([]);
    expect(result.normalCampaignAccessAffected).toBe(false);
  });

  it('keeps the same canonical fact distinct when it exists in both current and inherited history', () => {
    const result = buildNgPlusWorldEchoPresentation(
      history(['regional_alliance'], ['regional_alliance']),
      unlocked,
    );

    expect(result.currentFacts).toEqual(['regional_alliance']);
    expect(result.inheritedEchoes).toHaveLength(1);
    expect(result.inheritedEchoes[0]).toMatchObject({
      factId: 'regional_alliance',
      source: 'inherited',
      effect: 'candidate_rationale',
      campaign: 'vanguard',
    });
  });

  it('has exactly one deterministic presentation definition for every canonical World Fact', () => {
    expect(Object.keys(ngPlusWorldEchoDefinitions).sort()).toEqual([...worldFactIds].sort());

    for (const factId of worldFactIds) {
      const definition = ngPlusWorldEchoDefinitions[factId];
      expect(definition.presentationKey).toBe(`ngplus.world_echo.${factId}`);
      expect(['flavor', 'starting_event', 'hidden_quest', 'candidate_rationale', 'reward']).toContain(definition.effect);
      expect(definition.affectsNormalCampaignAccess).toBe(false);
    }
  });
});
