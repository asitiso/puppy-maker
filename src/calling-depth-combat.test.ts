import { describe, expect, it } from 'vitest';
import { applyExpeditionAction, startExpeditionBattle } from './expedition-combat';

const base = {
  strength: 50,
  magic: 50,
  calmness: 50,
  fatigue: 15,
  condition: 'normal' as const,
  huntMastery: 3,
  magicMastery: 3,
  restMastery: 3,
  talents: [] as const,
  relics: { attack: 0, charge: 0, dodge: 0, all: 0 },
};

describe('Calling signature combat effects', () => {
  it('boosts only the first attack with rally strike', () => {
    const plain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, base);
    const first = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, { ...base, signatures:['rally_strike'] as const });
    const second = applyExpeditionAction(first, 'attack', 0.9, { ...base, signatures:['rally_strike'] as const });
    const plainSecond = applyExpeditionAction(plain, 'attack', 0.9, base);
    expect(first.score).toBeGreaterThan(plain.score);
    expect(second.score - first.score).toBe(plainSecond.score - plain.score);
  });

  it('adds guardian breaker only on boss attacks', () => {
    const normal = applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, { ...base, signatures:['guardian_breaker'] as const, boss:false });
    const boss = applyExpeditionAction(startExpeditionBattle('forest_guardian'), 'attack', 0.9, { ...base, signatures:['guardian_breaker'] as const, boss:true });
    const bossPlain = applyExpeditionAction(startExpeditionBattle('forest_guardian'), 'attack', 0.9, { ...base, boss:true });
    expect(normal.score).toBe(applyExpeditionAction(startExpeditionBattle('forest_path'), 'attack', 0.9, base).score);
    expect(boss.score).toBeGreaterThan(bossPlain.score);
  });

  it('boosts first charge and first dodge with their signatures', () => {
    const chargePlain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'charge', 0.9, base);
    const charge = applyExpeditionAction(startExpeditionBattle('forest_path'), 'charge', 0.9, { ...base, signatures:['mana_echo'] as const });
    const dodgePlain = applyExpeditionAction(startExpeditionBattle('forest_path'), 'dodge', 0.9, base);
    const dodge = applyExpeditionAction(startExpeditionBattle('forest_path'), 'dodge', 0.9, { ...base, signatures:['gentle_guard'] as const });
    expect(charge.score).toBeGreaterThan(chargePlain.score);
    expect(dodge.pressureGuard).toBeGreaterThan(dodgePlain.pressureGuard);
  });

  it('tracks action counts for specialist Calling mastery', () => {
    let battle = startExpeditionBattle('forest_path');
    battle = applyExpeditionAction(battle, 'attack', 0.8, base);
    battle = applyExpeditionAction(battle, 'attack', 0.8, base);
    battle = applyExpeditionAction(battle, 'dodge', 0.8, base);
    expect(battle.actionKinds).toEqual({ attack:2, dodge:1, charge:0 });
  });
});
