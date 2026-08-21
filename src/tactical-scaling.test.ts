import {describe,expect,it} from 'vitest';
import {resolveTacticalAction} from './tactical-engine';
import {createTacticalExpeditionBattle} from './tactical-expedition';
import {deriveCompanionUnit} from './tactical-companions';

function runaAttackDamage(power:number){
  const session=createTacticalExpeditionBattle('forest-1',['bear','owl'],{power,magic:20,agility:100,maxHp:120},7);
  const targetId='forest-1-enemy-1';
  const before=session.units.find(unit=>unit.id===targetId)!.hp;
  const next=resolveTacticalAction(session,{actorId:'runa',actionId:'attack',targetId});
  return before-next.units.find(unit=>unit.id===targetId)!.hp;
}

describe('tactical combat progression scaling',()=>{
  it('turns higher Runa power into higher real attack damage',()=>{
    expect(runaAttackDamage(80)).toBeGreaterThan(runaAttackDamage(20));
  });

  it('carries companion role scaling into engine combat power fields',()=>{
    const leader={power:60,magic:50,agility:30,maxHp:140};
    const wolf=deriveCompanionUnit('wolf',leader);
    const owl=deriveCompanionUnit('owl',leader);
    expect(wolf.attackPower).toBeGreaterThan(owl.attackPower);
    expect(owl.supportPower).toBeGreaterThan(0);
    expect(owl.skillPower).toBeGreaterThan(0);
  });
});
