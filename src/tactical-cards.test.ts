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

  it('sanitizes non-finite card scaling instead of corrupting target HP', () => {
    const start = session();
    const next = resolveCard(start,'runa','basic_strike','e1',{ str:Number.NaN,mag:10,sen:10,mor:10 });
    const target = next.units.find(unit => unit.id === 'e1')!;
    expect(Number.isFinite(target.hp)).toBe(true);
    expect(target.hp).toBeLessThan(100);
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

  it('keeps focus_magic self-only so it cannot damage a friendly target', () => {
    const start = session();
    expect(resolveCard(start,'runa','focus_magic','bear',{ str:20,mag:10,sen:10,mor:10 })).toBe(start);
    expect(start.units.find(unit => unit.id === 'bear')?.hp).toBe(100);
  });

  it('returns the same session when focus_magic cannot restore any more resource', () => {
    const start = session();
    start.units = start.units.map(unit => unit.id === 'runa' ? { ...unit,ap:3,mp:10 } : unit);
    expect(resolveCard(start,'runa','focus_magic','runa',{ str:20,mag:10,sen:10,mor:10 })).toBe(start);
  });

  it('returns the same session for an illegal target', () => {
    const start = session();
    expect(resolveCard(start,'runa','basic_strike','bear',{ str:20,mag:10,sen:10,mor:10 })).toBe(start);
  });
});
