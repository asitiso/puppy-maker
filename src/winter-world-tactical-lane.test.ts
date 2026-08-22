import { describe, expect, it } from 'vitest';
import type { AutumnChoiceCommitment } from './autumn-major-choice';
import { getAutumnMajorChoiceWorldFacts } from './autumn-world-consequences';
import {
  getWinterLongNightWorldCrisis,
  resolveWinterLongNightWorldConsequence,
  type WinterLongNightWorldCrisis,
} from './winter-long-night-world';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
  type TacticalScenario,
} from './tactical-scenario';
import {
  mapWinterTacticalResultToMajorOutcome,
  winterLongNightWorldCrisisToTacticalScenario,
} from './winter-world-tactical-lane';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

const choices = {
  caretaker: { campaign: 'caretaker', choiceId: 'caretaker_autumn', optionId: 'team_solution' },
  pathfinder: { campaign: 'pathfinder', choiceId: 'pathfinder_autumn', optionId: 'limited_access' },
  vanguard: { campaign: 'vanguard', choiceId: 'vanguard_autumn', optionId: 'centralize' },
  arcanist: { campaign: 'arcanist', choiceId: 'arcanist_autumn', optionId: 'controlled_use' },
} as const satisfies Record<string, AutumnChoiceCommitment>;

function crisisFor(commitment: AutumnChoiceCommitment) {
  const facts = getAutumnMajorChoiceWorldFacts(commitment.campaign, commitment.optionId)!;
  const crisis = getWinterLongNightWorldCrisis(commitment, {
    currentFacts: [...facts],
    inheritedFacts: ['rift_stabilized'],
  });
  expect(crisis).not.toBeNull();
  return crisis!;
}

function battleFor(commitment: AutumnChoiceCommitment, seed: number) {
  const crisis = crisisFor(commitment);
  const scenario = winterLongNightWorldCrisisToTacticalScenario(crisis);
  expect(scenario.campaign).toBe(commitment.campaign);
  expect(scenario.stageId).toBe(crisis.stageId);
  expect(scenario.failForward).toBe(true);
  const battle = createTacticalScenarioBattle(scenario, companions, progression, seed);
  expect(battle.units.filter(unit => unit.side === 'ally')).toHaveLength(3);
  expect(battle.units.filter(unit => unit.side === 'enemy')).toHaveLength(3);
  return { crisis, scenario, battle };
}

function handoffWorld(
  crisis: WinterLongNightWorldCrisis,
  scenario: TacticalScenario,
  session: ReturnType<typeof createTacticalScenarioBattle>,
  attemptKey: string,
) {
  const terminal = resolveTacticalScenarioResult(scenario, session, attemptKey);
  expect(terminal).not.toBeNull();
  const handed = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal);
  expect(handed.result).not.toBeNull();
  const outcome = mapWinterTacticalResultToMajorOutcome(handed.result!);
  const world = resolveWinterLongNightWorldConsequence(crisis.campaign, outcome);
  expect(world).not.toBeNull();
  expect(world!.failForward).toBe(true);
  const replay = handoffTacticalTerminalResult(handed.state, terminal);
  expect(replay.result).toBeNull();
  return { terminal: handed.result!, outcome, world: world! };
}

describe('V3 Winter Lane B Long Night World + Tactical E2E', () => {
  it('Caretaker team solution creates coordinated preservation pressure and a flawless night_broken consequence', () => {
    const { crisis, scenario, battle } = battleFor(choices.caretaker, 501);
    expect(crisis.tacticalAdjustment).toBe('preservation_coordinated');
    expect(scenario.objective).toEqual({ type: 'survive', rounds: 4 });
    const flawless = {
      ...battle,
      round: 5,
      units: battle.units.map(unit => unit.side === 'enemy' ? { ...unit, hp: 0 } : { ...unit, hp: unit.maxHp }),
    };
    const { terminal, outcome, world } = handoffWorld(crisis, scenario, flawless, 'winter-caretaker-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(terminal.battleResult).toBe('victory');
    expect(outcome).toBe('exceptional_victory');
    expect(world.consequence).toBe('night_broken');
  });

  it('Pathfinder limited access creates phase-weakened escape pressure and costly fail-forward consequence', () => {
    const { crisis, scenario, battle } = battleFor(choices.pathfinder, 502);
    expect(crisis.tacticalAdjustment).toBe('route_phase_weakened');
    expect(scenario.objective).toEqual({ type: 'escape', afterRounds: 1 });
    const escaped = { ...battle, round: 2 };
    const { terminal, outcome, world } = handoffWorld(crisis, scenario, escaped, 'winter-pathfinder-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(terminal.battleResult).toBeNull();
    expect(outcome).toBe('costly_victory');
    expect(world.consequence).toBe('night_survived_at_cost');
  });

  it('Vanguard centralization creates hardest elite chain and a damaged victory night_endured consequence', () => {
    const { crisis, scenario, battle } = battleFor(choices.vanguard, 503);
    expect(crisis.tacticalAdjustment).toBe('elite_chain_centralized');
    expect(scenario.modifiers[0]).toEqual({ campaign: 'vanguard', kind: 'elite', levelBonus: 5 });
    const wonWithDamage = {
      ...battle,
      round: 2,
      units: battle.units.map(unit => {
        if (unit.side === 'enemy') return { ...unit, hp: 0 };
        if (unit.id === 'runa') return { ...unit, hp: Math.max(1, unit.maxHp - 1) };
        return unit;
      }),
    };
    const { terminal, outcome, world } = handoffWorld(crisis, scenario, wonWithDamage, 'winter-vanguard-1');
    expect(terminal.battleResult).toBe('victory');
    expect(terminal.damageTaken).toBeGreaterThan(0);
    expect(outcome).toBe('victory');
    expect(world.consequence).toBe('night_endured');
  });

  it('Arcanist controlled Relic creates controlled rule shift and defeat still resolves to night_scars_remain', () => {
    const { crisis, scenario, battle } = battleFor(choices.arcanist, 504);
    expect(crisis.tacticalAdjustment).toBe('rule_shift_controlled');
    const defeated = {
      ...battle,
      round: 2,
      units: battle.units.map(unit => unit.side === 'ally' ? { ...unit, hp: 0 } : unit),
    };
    const { terminal, outcome, world } = handoffWorld(crisis, scenario, defeated, 'winter-arcanist-1');
    expect(terminal.objectiveResult).toBe('failure');
    expect(terminal.battleResult).toBe('defeat');
    expect(outcome).toBe('defeat');
    expect(world.consequence).toBe('night_scars_remain');
  });

  it('rejects a World crisis whose stage or campaign no longer matches the canonical Tactical route', () => {
    const crisis = crisisFor(choices.caretaker);
    expect(() => winterLongNightWorldCrisisToTacticalScenario({ ...crisis, stageId: 'city_core' })).toThrow();
    expect(() => winterLongNightWorldCrisisToTacticalScenario({ ...crisis, campaign: 'pathfinder' })).toThrow();
  });
});
