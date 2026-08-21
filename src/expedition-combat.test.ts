import { describe, expect, it } from 'vitest';
import {
  applyExpeditionAction,
  EXPEDITION_ACTION_LIMIT,
  finishExpeditionBattle,
  startExpeditionBattle,
} from './expedition-combat';

const base = {
  strength: 40,
  magic: 40,
  calmness: 40,
  fatigue: 20,
  condition: 'normal' as const,
  huntMastery: 2,
  magicMastery: 2,
  restMastery: 2,
  talents: [] as const,
  relics: { attack: 0, charge: 0, dodge: 0, all: 0 },
};

function runActions(
  stageId: Parameters<typeof startExpeditionBattle>[0],
  kind: 'attack' | 'charge',
  input: Parameters<typeof applyExpeditionAction>[3],
) {
  let battle = startExpeditionBattle(stageId);
  for (let index = 0; index < EXPEDITION_ACTION_LIMIT; index += 1) {
    battle = applyExpeditionAction(battle, kind, 1, input);
  }
  return finishExpeditionBattle(battle);
}

describe('expedition combat', () => {
  it('makes attack respond strongly to strength and hunt mastery', () => {
    const low = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.8, base);
    const high = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.8, { ...base, strength: 80, huntMastery: 5 });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('makes charge respond strongly to magic and magic mastery', () => {
    const low = applyExpeditionAction(startExpeditionBattle('forest_path'), 'charge', 0.8, base);
    const high = applyExpeditionAction(startExpeditionBattle('forest_path'), 'charge', 0.8, { ...base, magic: 80, magicMastery: 5 });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('makes dodge reduce pressure using calmness and rest mastery', () => {
    const low = applyExpeditionAction(startExpeditionBattle('forest_path'), 'dodge', 0.8, base);
    const high = applyExpeditionAction(startExpeditionBattle('forest_path'), 'dodge', 0.8, { ...base, calmness: 80, restMastery: 5 });
    expect(high.pressureGuard).toBeGreaterThan(low.pressureGuard);
  });

  it('penalizes tired high-fatigue expeditions', () => {
    const ready = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, base);
    const tired = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, { ...base, condition: 'tired', fatigue: 85 });
    expect(tired.score).toBeLessThan(ready.score);
  });

  it('applies bounded additive relic modifiers', () => {
    const plain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 1, base);
    const relic = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 1, { ...base, relics: { attack: 0.06, charge: 0, dodge: 0, all: 0.03 } });
    expect(relic.score).toBeGreaterThan(plain.score);
    expect(relic.score).toBeLessThan(plain.score * 1.2);
  });

  it('converts existing advanced talents into small expedition bonuses', () => {
    const attackPlain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, base);
    const attackTalented = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, { ...base, talents: ['hunter_instinct', 'guardian_strike'] });
    const chargePlain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'charge', 0.9, base);
    const chargeTalented = applyExpeditionAction(startExpeditionBattle('forest_path'), 'charge', 0.9, { ...base, talents: ['arcane_rhythm', 'star_channel'] });
    const dodgePlain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'dodge', 0.9, base);
    const dodgeTalented = applyExpeditionAction(startExpeditionBattle('forest_path'), 'dodge', 0.9, { ...base, talents: ['steady_recovery', 'deep_rest'] });
    expect(attackTalented.score).toBeGreaterThan(attackPlain.score);
    expect(chargeTalented.score).toBeGreaterThan(chargePlain.score);
    expect(dodgeTalented.pressureGuard).toBeGreaterThan(dodgePlain.pressureGuard);
  });

  it('stops accepting actions after the fixed expedition action limit', () => {
    let battle = startExpeditionBattle('forest_path');
    for (let index = 0; index < EXPEDITION_ACTION_LIMIT; index += 1) {
      battle = applyExpeditionAction(battle, 'attack', 1, base);
    }

    const capped = battle;
    const overflow = applyExpeditionAction(capped, 'charge', 1, {
      ...base,
      magic: 999,
      magicMastery: 99,
    });

    expect(capped.actionCount).toBe(EXPEDITION_ACTION_LIMIT);
    expect(overflow).toEqual(capped);
  });

  it('cannot bypass the action cap when a reloaded battle has a stale actionCount', () => {
    const staleReloadedBattle = {
      ...startExpeditionBattle('forest_path'),
      score: 500,
      actionCount: 0,
      actionKinds: { attack: 2, dodge: 1, charge: 0 },
    };

    const overflow = applyExpeditionAction(staleReloadedBattle, 'charge', 1, {
      ...base,
      magic: 999,
      magicMastery: 99,
    });

    expect(overflow).toEqual(staleReloadedBattle);
  });

  it('cannot bypass the action cap when a reloaded actionCount is NaN', () => {
    const malformedReloadedBattle = {
      ...startExpeditionBattle('forest_path'),
      score: 500,
      actionCount: Number.NaN,
      actionKinds: { attack: 2, dodge: 1, charge: 0 },
    };

    const overflow = applyExpeditionAction(malformedReloadedBattle, 'charge', 1, base);

    expect(overflow).toEqual(malformedReloadedBattle);
  });

  it('fails closed when reloaded action counters contain positive infinity', () => {
    const malformedActionCount = {
      ...startExpeditionBattle('forest_path'),
      score: 500,
      actionCount: Number.POSITIVE_INFINITY,
      actionKinds: { attack: 0, dodge: 0, charge: 0 },
    };
    const malformedActionKinds = {
      ...startExpeditionBattle('forest_path'),
      score: 500,
      actionCount: 0,
      actionKinds: { attack: Number.POSITIVE_INFINITY, dodge: 0, charge: 0 },
    };

    expect(applyExpeditionAction(malformedActionCount, 'charge', 1, base)).toEqual(malformedActionCount);
    expect(applyExpeditionAction(malformedActionKinds, 'charge', 1, base)).toEqual(malformedActionKinds);
  });

  it('repairs a stale low actionCount when one legal action remains', () => {
    const staleReloadedBattle = {
      ...startExpeditionBattle('forest_path'),
      score: 300,
      actionCount: 0,
      actionKinds: { attack: 1, dodge: 1, charge: 0 },
    };

    const finalLegalAction = applyExpeditionAction(staleReloadedBattle, 'charge', 1, base);
    const overflow = applyExpeditionAction(finalLegalAction, 'attack', 1, base);

    expect(finalLegalAction.actionCount).toBe(EXPEDITION_ACTION_LIMIT);
    expect(finalLegalAction.actionKinds).toEqual({ attack: 1, dodge: 1, charge: 1 });
    expect(overflow).toEqual(finalLegalAction);
  });

  it('does not leak non-finite combat inputs into transient battle or result state', () => {
    const malformed = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', Number.NaN, {
      ...base,
      strength: Number.POSITIVE_INFINITY,
      fatigue: Number.NaN,
      huntMastery: Number.NaN,
      relics: { attack: Number.NaN, charge: 0, dodge: 0, all: Number.POSITIVE_INFINITY },
    });
    const result = finishExpeditionBattle({
      ...malformed,
      pressureGuard: Number.POSITIVE_INFINITY,
    });

    expect(Number.isFinite(malformed.score)).toBe(true);
    expect(Number.isFinite(malformed.pressureGuard)).toBe(true);
    expect(malformed.actionCount).toBe(1);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(Number.isFinite(result.fatigueDelta)).toBe(true);
    expect(Number.isFinite(result.stressDelta)).toBe(true);
    expect(result.grade).toBe('C');
  });

  it('keeps the final boss gated from a low-growth build', () => {
    const result = runActions('lake_tempest', 'attack', {
      ...base,
      strength: 40,
      huntMastery: 2,
    });
    expect(result.grade).toBe('C');
  });

  it('lets a developed expedition specialist reach A on the final boss', () => {
    const result = runActions('lake_tempest', 'attack', {
      ...base,
      strength: 80,
      huntMastery: 5,
      condition: 'energetic',
      talents: ['hunter_instinct', 'guardian_strike'],
      relics: { attack: 0.10, charge: 0, dodge: 0, all: 0.05 },
      identity: { attack: 0.10, dodge: 0, charge: 0 },
      signatures: ['rally_strike', 'guardian_breaker'],
      boss: true,
    });
    expect(result.grade).toMatch(/^[SA]$/);
  });

  it('lets a fully developed expedition specialist reach S on the final boss', () => {
    const result = runActions('lake_tempest', 'attack', {
      ...base,
      strength: 100,
      huntMastery: 5,
      condition: 'energetic',
      talents: ['hunter_instinct', 'guardian_strike'],
      relics: { attack: 0.10, charge: 0, dodge: 0, all: 0.05 },
      identity: { attack: 0.10, dodge: 0, charge: 0 },
      signatures: ['rally_strike', 'guardian_breaker'],
      boss: true,
    });
    expect(result.grade).toBe('S');
  });

  it('finishes with stage pressure converted to fatigue and stress deltas', () => {
    let battle = startExpeditionBattle('forest_guardian');
    battle = applyExpeditionAction(battle, 'attack', 0.9, base);
    battle = applyExpeditionAction(battle, 'dodge', 0.8, base);
    const result = finishExpeditionBattle(battle);
    expect(result.fatigueDelta).toBeGreaterThanOrEqual(0);
    expect(result.stressDelta).toBeGreaterThanOrEqual(0);
    expect(result.grade).toMatch(/^[SABC]$/);
  });
});