import { describe, expect, it } from 'vitest';
import { applyExpeditionAction, finishExpeditionBattle, startExpeditionBattle } from './expedition-combat';

const base = {
  strength: 40,
  magic: 40,
  calmness: 40,
  fatigue: 20,
  condition: 'normal' as const,
  huntMastery: 2,
  magicMastery: 2,
  restMastery: 2,
  relics: { attack: 0, charge: 0, dodge: 0, all: 0 },
};

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
