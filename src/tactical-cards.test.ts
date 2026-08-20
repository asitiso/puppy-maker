import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { canPlayCard, drawBattleHand, resolveCard, tacticalCards } from './tactical-cards';

const unit = (id:string, side:'ally'|'enemy', hp=100):TacticalUnit => ({ id,side,position:'front',maxHp:100,hp,agility:10,ap:3,maxAp:3,mp:5,maxMp:10,shield:0 });
const session = () => createBattleSession([unit('runa','ally'),unit('bear','ally'),unit('owl','ally')],[unit('e1','enemy'),unit('e2','enemy'),unit('e3','enemy')],7);

describe('tactical cards', () => {
  it('draws a deterministic four-card hand from a seed', () => {
    const deck = tacticalCards.map(card => card.id);
    expect(drawBattleHand(42,deck,4)).toEqual(drawBattleHand(42,deck,4));
    expect(drawBattleHand(42,deck,4)).toHaveLength(4);
  });

  it('enforces AP and MP affordability', () => {
    const actor = { ...session().units[0], ap:0, mp:0 };
    expect(canPlayCard(actor,tacticalCards.find(card => card.id === 'basic_strike')!)).toBe(false);
    expect(canPlayCard(actor,tacticalCards.find(card => card.id === 'moon_burst')!)).toBe(false);
  });

  it('spends resources once and damages a legal enemy', () => {
    const start = session();
    const next = resolveCard(start,'runa','basic_strike','e1',{ str:20,mag:10,sen:10,mor:10 });
    expect(next.units.find(unit => unit.id === 'runa')?.ap).toBe(2);
    expect(next.units.find(unit => unit.id === 'e1')?.hp).toBeLessThan(100);
  });

  it('applies a support card when the actor targets themself', () => {
    const start = session();
    start.units = start.units.map(unit => unit.id === 'runa' ? { ...unit,hp:45 } : unit);
    const next = resolveCard(start,'runa','healing_light','runa',{ str:20,mag:10,sen:20,mor:10 });
    const runa = next.units.find(unit => unit.id === 'runa')!;
    expect(runa.hp).toBeGreaterThan(45);
    expect(runa.ap).toBe(1);
    expect(runa.mp).toBe(3);
  });

  it('returns the same session for an illegal target', () => {
    const start = session();
    expect(resolveCard(start,'runa','basic_strike','bear',{ str:20,mag:10,sen:10,mor:10 })).toBe(start);
  });
});
