import {describe,expect,it} from 'vitest';
import {createBattleSession,type TacticalUnit} from './tactical-battle';
import {chooseTacticalEngineAction} from './tactical-ai';
import {tacticalActionHand} from './tactical-hand';

const unit=(id:string,side:'ally'|'enemy',agility=10,mp=0):TacticalUnit=>({id,side,position:'front',maxHp:100,hp:100,agility,ap:3,maxAp:3,mp,maxMp:10,shield:0});
const makeSession=(seed:number)=>createBattleSession([
  unit('runa','ally',30,10),unit('companion-wolf','ally',20),unit('companion-owl','ally',10),
],[unit('enemy-a','enemy',18),unit('enemy-b','enemy',9),unit('enemy-c','enemy',8)],seed);

describe('seeded tactical action hand',()=>{
  it('draws exactly four deterministic action cards',()=>{
    const session=makeSession(73);
    const first=tacticalActionHand(session,'runa');
    expect(first).toHaveLength(4);
    expect(first).toEqual(tacticalActionHand(session,'runa'));
    expect(first.every(id=>['attack','skill','support','special'].includes(id))).toBe(true);
  });

  it('makes engine AUTO choose only from the current four card hand',()=>{
    const session=Array.from({length:40},(_,seed)=>makeSession(seed)).find(candidate=>!tacticalActionHand(candidate,'runa').includes('special'))!;
    const hand=tacticalActionHand(session,'runa');
    const move=chooseTacticalEngineAction(session,'runa',session.seed);
    expect(move).not.toBeNull();
    expect(hand).toContain(move!.actionId);
    expect(move!.actionId).not.toBe('special');
  });
});
