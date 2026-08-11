import { describe, expect, it } from 'vitest';
import { createBattleSession, type TacticalUnit } from './tactical-battle';
import { resolveTacticalAction } from './tactical-engine';
import { addTacticalStatus } from './tactical-status';

const unit = (id:string,side:'ally'|'enemy',agility:number):TacticalUnit => ({ id,side,position:'front',maxHp:100,hp:100,agility,ap:3,maxAp:3,mp:0,maxMp:10,shield:0 });
const session = () => createBattleSession([unit('runa','ally',20),unit('a2','ally',8),unit('a3','ally',6)],[unit('e1','enemy',10),unit('e2','enemy',5),unit('e3','enemy',4)],1);

describe('tactical status engine integration', () => {
  it('focus increases outgoing attack power', () => {
    const battle = session();
    battle.units = battle.units.map(entry => entry.id === 'runa' ? addTacticalStatus(entry,'focus',2) : entry);
    const next = resolveTacticalAction(battle,{ actorId:'runa',actionId:'attack',targetId:'e1' });
    expect(next.units.find(entry => entry.id === 'e1')?.hp).toBe(76);
  });

  it('break reduces outgoing attack power', () => {
    const battle = session();
    battle.units = battle.units.map(entry => entry.id === 'runa' ? addTacticalStatus(entry,'break',2) : entry);
    const next = resolveTacticalAction(battle,{ actorId:'runa',actionId:'attack',targetId:'e1' });
    expect(next.units.find(entry => entry.id === 'e1')?.hp).toBe(84);
  });

  it('advances regen and status duration when a round rolls over', () => {
    let battle = session();
    battle.units = battle.units.map(entry => entry.id === 'runa' ? addTacticalStatus({ ...entry,hp:60 },'regen',2) : entry);
    const moves:[string,string][] = [['runa','e1'],['e1','runa'],['a2','e1'],['a3','e2'],['e2','a2'],['e3','a3']];
    for (const [actorId,targetId] of moves) battle = resolveTacticalAction(battle,{ actorId,actionId:'attack',targetId });
    const runa = battle.units.find(entry => entry.id === 'runa')!;
    expect(battle.round).toBe(2);
    expect(runa.hp).toBe(48);
    expect(runa.statuses).toEqual([{ id:'regen',turns:1 }]);
  });
});
