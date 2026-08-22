import { describe, expect, it } from 'vitest';
import { resolveGuardianFestivalWorldOutcome } from './campaign-world';
import { getSummerGuardianFestivalWorldRoute } from './summer-campaign-world';
import { getSummerGuardianFestivalTacticalClimax } from './summer-tactical-climax';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
  type TacticalScenario,
} from './tactical-scenario';
import {
  mapSummerTacticalResultToGuardianFestivalOutcome,
  summerWorldRouteToTacticalClimax,
} from './summer-world-tactical-lane';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

function battleFor(campaign: 'caretaker' | 'pathfinder' | 'vanguard' | 'arcanist', seed: number) {
  const route = getSummerGuardianFestivalWorldRoute(campaign)!;
  const climax = summerWorldRouteToTacticalClimax(route);
  expect(climax).toEqual(getSummerGuardianFestivalTacticalClimax(campaign));
  expect(climax.stageId).toBe(route.stageId);
  expect(climax.failForward).toBe(true);
  const battle = createTacticalScenarioBattle(climax, companions, progression, seed);
  expect(battle.units.filter(unit => unit.side === 'ally')).toHaveLength(3);
  expect(battle.units.filter(unit => unit.side === 'enemy')).toHaveLength(3);
  return { route, climax, battle };
}

function commitWorld(
  climax: TacticalScenario,
  session: ReturnType<typeof createTacticalScenarioBattle>,
  attemptKey: string,
) {
  const terminal = resolveTacticalScenarioResult(climax, session, attemptKey);
  expect(terminal).not.toBeNull();
  const handed = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal);
  expect(handed.result).not.toBeNull();
  const outcome = mapSummerTacticalResultToGuardianFestivalOutcome(handed.result!);
  const world = resolveGuardianFestivalWorldOutcome({
    outcome,
    worldHistory: { currentFacts: [], inheritedFacts: ['ancient_route_opened'] },
    majorOutcomes: {},
    failForwardOutcomes: [],
  });
  const replay = handoffTacticalTerminalResult(handed.state, terminal);
  expect(replay.result).toBeNull();
  return { terminal: handed.result!, outcome, world };
}

describe('V3 Summer Lane B World + Tactical Guardian Festival E2E', () => {
  it('Caretaker rescue/survival can earn exceptional victory and canonical saved Festival history', () => {
    const { climax, battle } = battleFor('caretaker', 101);
    const flawlessVictory = {
      ...battle,
      round: 4,
      units: battle.units.map(unit => unit.side === 'enemy' ? { ...unit, hp: 0 } : { ...unit, hp: unit.maxHp }),
    };
    const { outcome, world, terminal } = commitWorld(climax, flawlessVictory, 'summer-caretaker-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(terminal.battleResult).toBe('victory');
    expect(terminal.survivingAllies).toBe(3);
    expect(terminal.damageTaken).toBe(0);
    expect(outcome).toBe('exceptional_victory');
    expect(world.outcome).toBe('exceptional_victory');
    expect(world.worldHistory.currentFacts).toEqual(['festival_saved']);
    expect(world.worldHistory.inheritedFacts).toEqual(['ancient_route_opened']);
    expect(world.failForwardOutcomes).toEqual([]);
  });

  it('Pathfinder escape success without full battle victory becomes costly fail-forward history', () => {
    const { climax, battle } = battleFor('pathfinder', 102);
    const escaped = { ...battle, round: 3 };
    const { outcome, world, terminal } = commitWorld(climax, escaped, 'summer-pathfinder-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(terminal.battleResult).toBeNull();
    expect(outcome).toBe('costly_victory');
    expect(world.outcome).toBe('costly_victory');
    expect(world.worldHistory.currentFacts).toEqual(['festival_heavy_losses']);
    expect(world.failForwardOutcomes).toEqual(['guardian_festival']);
  });

  it('Vanguard elite tournament victory with damage remains a normal victory', () => {
    const { climax, battle } = battleFor('vanguard', 103);
    const wonWithDamage = {
      ...battle,
      round: 2,
      units: battle.units.map(unit => {
        if (unit.side === 'enemy') return { ...unit, hp: 0 };
        if (unit.id === 'runa') return { ...unit, hp: Math.max(1, unit.maxHp - 1) };
        return unit;
      }),
    };
    const { outcome, world, terminal } = commitWorld(climax, wonWithDamage, 'summer-vanguard-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(terminal.battleResult).toBe('victory');
    expect(terminal.damageTaken).toBeGreaterThan(0);
    expect(outcome).toBe('victory');
    expect(world.outcome).toBe('victory');
    expect(world.worldHistory.currentFacts).toEqual(['festival_saved']);
    expect(world.failForwardOutcomes).toEqual([]);
  });

  it('Arcanist relic/rule-shift defeat commits defeat fail-forward history exactly once', () => {
    const { climax, battle } = battleFor('arcanist', 104);
    const defeated = {
      ...battle,
      round: 2,
      units: battle.units.map(unit => unit.side === 'ally' ? { ...unit, hp: 0 } : unit),
    };
    const { outcome, world, terminal } = commitWorld(climax, defeated, 'summer-arcanist-1');
    expect(terminal.objectiveResult).toBe('failure');
    expect(terminal.battleResult).toBe('defeat');
    expect(outcome).toBe('defeat');
    expect(world.outcome).toBe('defeat');
    expect(world.worldHistory.currentFacts).toEqual(['festival_heavy_losses']);
    expect(world.failForwardOutcomes).toEqual(['guardian_festival']);
  });

  it('rejects World/Tactical campaign mismatch instead of inventing a cross-route fallback', () => {
    const caretaker = getSummerGuardianFestivalWorldRoute('caretaker')!;
    const vanguard = getSummerGuardianFestivalTacticalClimax('vanguard')!;
    expect(() => summerWorldRouteToTacticalClimax({ ...caretaker, stageId: vanguard.stageId })).toThrow();
  });
});
