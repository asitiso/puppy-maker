import { describe, expect, it } from 'vitest';
import type { MainCampaignId } from './campaign-model';
import { buildGreatExpeditionWorldPrerequisite } from './campaign-world';
import { getAutumnGreatExpeditionWorldRoute } from './autumn-campaign-world';
import { getAutumnGreatExpeditionTacticalClimax } from './autumn-tactical-climax';
import {
  createTacticalScenarioBattle,
  createTacticalTerminalHandoffState,
  handoffTacticalTerminalResult,
  resolveTacticalScenarioResult,
  type TacticalScenario,
} from './tactical-scenario';
import {
  autumnWorldRouteToTacticalClimax,
  greatExpeditionEvidenceFromTacticalResult,
} from './autumn-world-tactical-lane';

const progression = { maxHp: 120, agility: 15, power: 24, magic: 20 };
const companions = ['bear', 'owl'] as const;

function prerequisiteFor(campaign: MainCampaignId) {
  const input = {
    activeCampaign: campaign,
    worldHistory: {
      currentFacts: ['festival_saved'],
      inheritedFacts: ['rift_stabilized'],
    },
    majorOutcomes: { guardian_festival: 'victory' },
    failForwardOutcomes: [],
  } as const;
  return { input, snapshot: buildGreatExpeditionWorldPrerequisite(input) };
}

function battleFor(campaign: MainCampaignId, seed: number) {
  const prerequisite = prerequisiteFor(campaign);
  const route = getAutumnGreatExpeditionWorldRoute(campaign, prerequisite.input)!;
  const climax = autumnWorldRouteToTacticalClimax(route);
  expect(climax).toEqual(getAutumnGreatExpeditionTacticalClimax(campaign));
  expect(climax.stageId).toBe(route.stageId);
  expect(climax.failForward).toBe(true);
  const battle = createTacticalScenarioBattle(climax, companions, progression, seed);
  expect(battle.units.filter(unit => unit.side === 'ally')).toHaveLength(3);
  expect(battle.units.filter(unit => unit.side === 'enemy')).toHaveLength(3);
  return { prerequisite, route, climax, battle };
}

function handoffEvidence(
  route: ReturnType<typeof getAutumnGreatExpeditionWorldRoute> extends infer T ? Exclude<T, null> : never,
  climax: TacticalScenario,
  session: ReturnType<typeof createTacticalScenarioBattle>,
  prerequisite: ReturnType<typeof buildGreatExpeditionWorldPrerequisite>,
  attemptKey: string,
) {
  const terminal = resolveTacticalScenarioResult(climax, session, attemptKey);
  expect(terminal).not.toBeNull();
  const handed = handoffTacticalTerminalResult(createTacticalTerminalHandoffState(), terminal);
  expect(handed.result).not.toBeNull();
  const evidence = greatExpeditionEvidenceFromTacticalResult(route, handed.result!, prerequisite);
  const replay = handoffTacticalTerminalResult(handed.state, terminal);
  expect(replay.result).toBeNull();
  return { terminal: handed.result!, evidence };
}

describe('V3 Autumn Lane B Great Expedition World + Tactical E2E', () => {
  it('Caretaker flawless rescue/survival yields exceptional Great Expedition evidence', () => {
    const { prerequisite, route, climax, battle } = battleFor('caretaker', 301);
    const flawless = {
      ...battle,
      round: 5,
      units: battle.units.map(unit => unit.side === 'enemy'
        ? { ...unit, hp: 0 }
        : { ...unit, hp: unit.maxHp }),
    };
    const { terminal, evidence } = handoffEvidence(route, climax, flawless, prerequisite.snapshot, 'autumn-caretaker-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(evidence.outcome).toBe('exceptional_victory');
    expect(evidence.currentFacts).toEqual(['festival_saved']);
    expect(evidence.inheritedFacts).toEqual(['rift_stabilized']);
  });

  it('Pathfinder successful traversal without full battle victory yields costly evidence', () => {
    const { prerequisite, route, climax, battle } = battleFor('pathfinder', 302);
    const escaped = { ...battle, round: 4 };
    const { terminal, evidence } = handoffEvidence(route, climax, escaped, prerequisite.snapshot, 'autumn-pathfinder-1');
    expect(terminal.objectiveResult).toBe('success');
    expect(terminal.battleResult).toBeNull();
    expect(evidence.outcome).toBe('costly_victory');
    expect(evidence.failForward).toBe(true);
  });

  it('Vanguard elite command victory with damage yields normal victory evidence', () => {
    const { prerequisite, route, climax, battle } = battleFor('vanguard', 303);
    const wonWithDamage = {
      ...battle,
      round: 2,
      units: battle.units.map(unit => {
        if (unit.side === 'enemy') return { ...unit, hp: 0 };
        if (unit.id === 'runa') return { ...unit, hp: Math.max(1, unit.maxHp - 1) };
        return unit;
      }),
    };
    const { evidence } = handoffEvidence(route, climax, wonWithDamage, prerequisite.snapshot, 'autumn-vanguard-1');
    expect(evidence.outcome).toBe('victory');
    expect(evidence.damageTaken).toBeGreaterThan(0);
  });

  it('Arcanist relic/rift defeat yields defeat evidence without inventing a choice consequence', () => {
    const { prerequisite, route, climax, battle } = battleFor('arcanist', 304);
    const defeated = {
      ...battle,
      round: 2,
      units: battle.units.map(unit => unit.side === 'ally' ? { ...unit, hp: 0 } : unit),
    };
    const { terminal, evidence } = handoffEvidence(route, climax, defeated, prerequisite.snapshot, 'autumn-arcanist-1');
    expect(terminal.objectiveResult).toBe('failure');
    expect(evidence.outcome).toBe('defeat');
    expect(evidence.eventId).toBe('great_expedition');
    expect('choice' in evidence).toBe(false);
  });

  it('rejects World/Tactical campaign or stage mismatch instead of cross-route fallback', () => {
    const prerequisite = prerequisiteFor('caretaker');
    const caretaker = getAutumnGreatExpeditionWorldRoute('caretaker', prerequisite.input)!;
    expect(() => autumnWorldRouteToTacticalClimax({ ...caretaker, stageId: 'city_core' })).toThrow();
  });
});
