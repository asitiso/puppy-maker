import { describe, expect, it } from 'vitest';
import {
  winterLongNightTacticalScenario,
  type WinterLongNightTacticalAdjustment,
} from './winter-long-night-tactical';
import { createTacticalScenarioBattle } from './tactical-scenario';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

const cases = [
  ['caretaker', 'forest_guardian', 'preservation_harder', 'survive'],
  ['caretaker', 'forest_guardian', 'preservation_supported', 'survive'],
  ['caretaker', 'forest_guardian', 'preservation_coordinated', 'survive'],
  ['pathfinder', 'city_core', 'route_shortcut_unstable', 'escape'],
  ['pathfinder', 'city_core', 'route_detour', 'escape'],
  ['pathfinder', 'city_core', 'route_phase_weakened', 'escape'],
  ['vanguard', 'city_core', 'elite_chain_centralized', 'target-elimination'],
  ['vanguard', 'city_core', 'elite_chain_distributed', 'target-elimination'],
  ['vanguard', 'city_core', 'elite_chain_coalition', 'target-elimination'],
  ['arcanist', 'lake_tempest', 'rule_shift_empowered_costly', 'standard'],
  ['arcanist', 'lake_tempest', 'rule_shift_without_relic', 'standard'],
  ['arcanist', 'lake_tempest', 'rule_shift_controlled', 'standard'],
] as const;

describe('V3 Winter Long Night Tactical scenarios', () => {
  it.each(cases)('maps %s %s history adjustment into the existing Tactical vocabulary', (campaign, stageId, tacticalAdjustment, objectiveType) => {
    const scenario = winterLongNightTacticalScenario({
      eventId: 'long_night',
      campaign,
      stageId,
      tacticalAdjustment: tacticalAdjustment as WinterLongNightTacticalAdjustment,
      failForward: true,
    });
    expect(scenario.campaign).toBe(campaign);
    expect(scenario.stageId).toBe(stageId);
    expect(scenario.objective.type).toBe(objectiveType);
    expect(scenario.failForward).toBe(true);
    expect(scenario.modifiers.every(modifier => modifier.campaign === campaign)).toBe(true);
  });

  it('materially changes encounter pressure across each campaign Autumn-history variant', () => {
    const caretaker = cases.slice(0, 3).map(([, stageId, tacticalAdjustment]) => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'caretaker', stageId, tacticalAdjustment, failForward: true }));
    expect(caretaker.map(item => item.objective)).toEqual([
      { type: 'survive', rounds: 6 },
      { type: 'survive', rounds: 5 },
      { type: 'survive', rounds: 4 },
    ]);

    const pathfinder = cases.slice(3, 6).map(([, stageId, tacticalAdjustment]) => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'pathfinder', stageId, tacticalAdjustment, failForward: true }));
    expect(pathfinder.map(item => item.objective)).toEqual([
      { type: 'escape', afterRounds: 2 },
      { type: 'escape', afterRounds: 4 },
      { type: 'escape', afterRounds: 1 },
    ]);

    const vanguard = cases.slice(6, 9).map(([, stageId, tacticalAdjustment]) => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'vanguard', stageId, tacticalAdjustment, failForward: true }));
    expect(vanguard.map(item => item.modifiers[0])).toEqual([
      { campaign: 'vanguard', kind: 'elite', levelBonus: 5 },
      { campaign: 'vanguard', kind: 'elite', levelBonus: 4 },
      { campaign: 'vanguard', kind: 'elite', levelBonus: 3 },
    ]);

    const arcanist = cases.slice(9, 12).map(([, stageId, tacticalAdjustment]) => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'arcanist', stageId, tacticalAdjustment, failForward: true }));
    expect(arcanist.map(item => item.modifiers.map(modifier => modifier.kind))).toEqual([
      ['relic-resonance', 'status-amplify', 'rule-shift'],
      ['status-amplify', 'rule-shift'],
      ['relic-resonance', 'status-amplify', 'rule-shift'],
    ]);
  });

  it('creates normal 3v3 sessions for all 12 Long Night variants', () => {
    for (const [index, [campaign, stageId, tacticalAdjustment]] of cases.entries()) {
      const scenario = winterLongNightTacticalScenario({ eventId: 'long_night', campaign, stageId, tacticalAdjustment, failForward: true });
      const battle = createTacticalScenarioBattle(scenario, companions, progression, 401 + index);
      expect(battle.units.filter(unit => unit.side === 'ally')).toHaveLength(3);
      expect(battle.units.filter(unit => unit.side === 'enemy')).toHaveLength(3);
    }
  });

  it('rejects cross-campaign adjustment, wrong stage, and disabled fail-forward instead of inventing a fallback', () => {
    expect(() => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'caretaker', stageId: 'forest_guardian', tacticalAdjustment: 'route_detour', failForward: true })).toThrow();
    expect(() => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'vanguard', stageId: 'lake_tempest', tacticalAdjustment: 'elite_chain_coalition', failForward: true })).toThrow();
    expect(() => winterLongNightTacticalScenario({ eventId: 'long_night', campaign: 'arcanist', stageId: 'lake_tempest', tacticalAdjustment: 'rule_shift_controlled', failForward: false })).toThrow();
  });
});
