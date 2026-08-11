import { describe, expect, it } from 'vitest';
import { createTacticalExpeditionBattle } from './tactical-expedition';
import { deriveCompanionUnit } from './tactical-companions';

const leader = { power:40, magic:36, agility:20, maxHp:120 };

describe('tactical resource integration', () => {
  it('uses AP 3 and MP 10 across Runa, companions and expedition enemies', () => {
    const session = createTacticalExpeditionBattle('forest-1',['bear','owl'],leader,5);
    expect(session.units.every(unit => unit.maxAp === 3)).toBe(true);
    expect(session.units.every(unit => unit.maxMp === 10)).toBe(true);
  });

  it('derives companions on the same action economy', () => {
    const bear = deriveCompanionUnit('bear',leader);
    expect(bear.ap).toBe(3);
    expect(bear.maxAp).toBe(3);
    expect(bear.maxMp).toBe(10);
  });
});
