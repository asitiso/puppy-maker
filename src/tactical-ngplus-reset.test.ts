import { describe, expect, it } from 'vitest';
import { createTacticalExpeditionBattle } from './tactical-expedition';
import { handoffTacticalTerminalResult } from './tactical-scenario';
import {
  createTacticalNgPlusRuntimeState,
  resetTacticalForNgPlus,
  type TacticalNgPlusResetState,
} from './tactical-ngplus-reset';

const dirtyState = (): TacticalNgPlusResetState => ({
  tacticalBattleRecords: {
    training_ground: { grade: 'S', bestRounds: 2, clearCount: 9 },
  },
  claimedTacticalFirstClears: ['training_ground'],
  selectedTacticalCompanions: ['wolf', 'cat'],
  tacticalCompanionBonds: {
    bear: { xp: 120, level: 3 },
    owl: { xp: 80, level: 2 },
    wolf: { xp: 300, level: 4 },
    cat: { xp: 220, level: 4 },
  },
  tacticalAutoBattle: true,
  tacticalBattleSpeed: 2,
});

const progression = { maxHp: 140, agility: 18, power: 28, magic: 24 };

describe('V3 NG+ Tactical reset/re-entry integrity', () => {
  it('resets run-owned Tactical progression while preserving non-power battle preferences', () => {
    const next = resetTacticalForNgPlus(dirtyState());

    expect(next.tacticalBattleRecords).toEqual({});
    expect(next.claimedTacticalFirstClears).toEqual([]);
    expect(next.selectedTacticalCompanions).toEqual([]);
    expect(next.tacticalCompanionBonds).toEqual({
      bear: { xp: 0, level: 1 },
      owl: { xp: 0, level: 1 },
      wolf: { xp: 0, level: 1 },
      cat: { xp: 0, level: 1 },
    });
    expect(next.tacticalAutoBattle).toBe(true);
    expect(next.tacticalBattleSpeed).toBe(2);
  });

  it('is idempotent across at least three NG+ cycles and never accumulates Tactical power', () => {
    const first = resetTacticalForNgPlus(dirtyState());
    const second = resetTacticalForNgPlus(first);
    const third = resetTacticalForNgPlus(second);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
    expect(Object.values(third.tacticalCompanionBonds).every(bond => bond.xp === 0 && bond.level === 1)).toBe(true);
  });

  it('creates an empty once-only terminal handoff scope for every new run', () => {
    const oldRuntime = createTacticalNgPlusRuntimeState();
    const terminal = {
      scenarioId: 'ngplus-reset-check',
      campaign: 'caretaker' as const,
      attemptKey: 'run-1',
      terminalKey: 'ngplus-reset-check:run-1',
      objectiveResult: 'success' as const,
      battleResult: 'victory' as const,
      failForward: true,
      rounds: 3,
      survivingAllies: 2,
      damageTaken: 40,
    };
    const consumed = handoffTacticalTerminalResult(oldRuntime.terminalHandoff, terminal);
    expect(consumed.result).not.toBeNull();
    expect(consumed.state.handedOffKeys).toHaveLength(1);

    const newRuntime = createTacticalNgPlusRuntimeState();
    expect(newRuntime.terminalHandoff.handedOffKeys).toEqual([]);
    expect(newRuntime).not.toBe(oldRuntime);
  });

  it('creates a fresh 3v3 BattleSession after a prior run is heavily mutated', () => {
    const prior = createTacticalExpeditionBattle('forest_path', ['bear', 'owl'], progression, 501);
    for (const unit of prior.units) {
      unit.hp = 0;
      unit.ap = 0;
      unit.mp = 10;
      unit.shield = 9999;
      unit.statuses = [{ id: 'break', turns: 99 }];
    }
    prior.round = 999;
    prior.timeline = [];
    prior.acted = prior.units.map(unit => unit.id);

    const fresh = createTacticalExpeditionBattle('forest_path', ['bear', 'owl'], progression, 502);
    expect(fresh).not.toBe(prior);
    expect(fresh.round).toBe(1);
    expect(fresh.acted).toEqual([]);
    expect(fresh.units.filter(unit => unit.side === 'ally')).toHaveLength(3);
    expect(fresh.units.filter(unit => unit.side === 'enemy')).toHaveLength(3);
    expect(fresh.units.every(unit => unit.hp > 0 && unit.hp <= unit.maxHp)).toBe(true);
    expect(fresh.units.every(unit => unit.ap >= 0 && unit.ap <= unit.maxAp)).toBe(true);
    expect(fresh.units.every(unit => unit.mp >= 0 && unit.mp <= unit.maxMp)).toBe(true);
    expect(fresh.units.every(unit => unit.shield < 9999)).toBe(true);
    expect(fresh.units.every(unit => !unit.statuses?.some(status => status.turns === 99))).toBe(true);
  });
});
