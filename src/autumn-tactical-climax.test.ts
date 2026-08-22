import { describe, expect, it } from 'vitest';
import {
  autumnGreatExpeditionTacticalClimaxes,
  getAutumnGreatExpeditionTacticalClimax,
} from './autumn-tactical-climax';
import { createTacticalScenarioBattle } from './tactical-scenario';

const campaigns = ['caretaker', 'pathfinder', 'vanguard', 'arcanist'] as const;
const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

describe('V3 Autumn Great Expedition Tactical climaxes', () => {
  it('defines one fail-forward climax for each main campaign using existing scenario vocabulary', () => {
    expect(autumnGreatExpeditionTacticalClimaxes).toHaveLength(4);
    expect(autumnGreatExpeditionTacticalClimaxes.map(item => item.campaign)).toEqual(campaigns);

    const caretaker = getAutumnGreatExpeditionTacticalClimax('caretaker')!;
    expect(caretaker.stageId).toBe('forest_guardian');
    expect(caretaker.objective).toEqual({ type: 'survive', rounds: 4 });
    expect(caretaker.modifiers.map(item => item.kind)).toEqual(['rescue', 'survive']);

    const pathfinder = getAutumnGreatExpeditionTacticalClimax('pathfinder')!;
    expect(pathfinder.stageId).toBe('city_core');
    expect(pathfinder.objective).toEqual({ type: 'escape', afterRounds: 3 });
    expect(pathfinder.modifiers.map(item => item.kind)).toEqual(['scout', 'turn-limit', 'escape']);

    const vanguard = getAutumnGreatExpeditionTacticalClimax('vanguard')!;
    expect(vanguard.stageId).toBe('city_core');
    expect(vanguard.objective).toEqual({ type: 'target-elimination', targetId: 'city_core-enemy-1' });
    expect(vanguard.modifiers.map(item => item.kind)).toEqual(['elite', 'chained-battle']);

    const arcanist = getAutumnGreatExpeditionTacticalClimax('arcanist')!;
    expect(arcanist.stageId).toBe('lake_tempest');
    expect(arcanist.objective).toEqual({ type: 'standard' });
    expect(arcanist.modifiers.map(item => item.kind)).toEqual(['relic-resonance', 'status-amplify', 'rule-shift']);

    for (const scenario of autumnGreatExpeditionTacticalClimaxes) {
      expect(scenario.failForward).toBe(true);
    }
  });

  it('creates normal 3v3 battle sessions through the existing Tactical engine', () => {
    for (const [index, scenario] of autumnGreatExpeditionTacticalClimaxes.entries()) {
      const battle = createTacticalScenarioBattle(scenario, companions, progression, 201 + index);
      expect(battle.units.filter(unit => unit.side === 'ally')).toHaveLength(3);
      expect(battle.units.filter(unit => unit.side === 'enemy')).toHaveLength(3);
    }
  });

  it('rejects malformed campaign lookup without fallback', () => {
    expect(getAutumnGreatExpeditionTacticalClimax('not-a-campaign')).toBeNull();
    expect(getAutumnGreatExpeditionTacticalClimax(null)).toBeNull();
  });
});
