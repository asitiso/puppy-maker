import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { resolveTacticalAction } from './tactical-engine';

type PoweredUnit = TacticalUnit & { attackPower?:number; skillPower?:number; supportPower?:number };
const unit = (id:string,side:'ally'|'enemy',agility:number,extra:Partial<PoweredUnit>={}):PoweredUnit => ({
  id,side,position:'front',maxHp:100,hp:100,agility,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,...extra,
});

const make = (actor:PoweredUnit,target:PoweredUnit) => createBattleSession(
  actor.side === 'ally' ? [actor,unit('a2','ally',4),unit('a3','ally',3)] : [unit('a1','ally',4),unit('a2','ally',3),target.side === 'ally' ? target : unit('a3','ally',2)],
  actor.side === 'enemy' ? [actor,unit('e2','enemy',4),unit('e3','enemy',3)] : [target,unit('e2','enemy',4),unit('e3','enemy',3)],
  1,
);

describe('tactical growth power integration', () => {
  it('uses actor attackPower for ATTACK when present', () => {
    const battle = make(unit('runa','ally',20,{ attackPower:42 }),unit('enemy','enemy',5));
    const next = resolveTacticalAction(battle,{ actorId:'runa',actionId:'attack',targetId:'enemy' });
    expect(next.units.find(entry => entry.id === 'enemy')?.hp).toBe(58);
  });

  it('uses actor skillPower for SKILL when present', () => {
    const battle = make(unit('runa','ally',20,{ skillPower:51 }),unit('enemy','enemy',5));
    const next = resolveTacticalAction(battle,{ actorId:'runa',actionId:'skill',targetId:'enemy' });
    expect(next.units.find(entry => entry.id === 'enemy')?.hp).toBe(49);
  });

  it('uses actor supportPower for SUPPORT when present', () => {
    const healer = unit('runa','ally',20,{ supportPower:37 });
    const battle = make(healer,unit('enemy','enemy',5));
    battle.units = battle.units.map(entry => entry.id === 'a2' ? { ...entry,hp:40 } : entry);
    const next = resolveTacticalAction(battle,{ actorId:'runa',actionId:'support',targetId:'a2' });
    expect(next.units.find(entry => entry.id === 'a2')?.hp).toBe(77);
  });

  it('falls back to action base power for legacy units', () => {
    const battle = make(unit('runa','ally',20),unit('enemy','enemy',5));
    const next = resolveTacticalAction(battle,{ actorId:'runa',actionId:'attack',targetId:'enemy' });
    expect(next.units.find(entry => entry.id === 'enemy')?.hp).toBe(80);
  });
});
