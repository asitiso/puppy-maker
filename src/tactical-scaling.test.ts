import {describe,expect,it} from 'vitest';
import {resolveTacticalAction} from './tactical-engine';
import {createTacticalExpeditionBattle,tacticalBattleNodeForStage} from './tactical-expedition';
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

  it('keeps Runa attack scaling finite and monotonic across a broad progression range',()=>{
    const damages=[1,20,40,80,160].map(runaAttackDamage);
    expect(damages.every(Number.isFinite)).toBe(true);
    for(let index=1;index<damages.length;index+=1)expect(damages[index]).toBeGreaterThanOrEqual(damages[index-1]);
  });

  it('keeps stage levels bounded from 1 through 10 for arbitrary stage ids',()=>{
    for(let index=0;index<500;index+=1){
      const level=tacticalBattleNodeForStage(`stability-stage-${index}`).level;
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(10);
    }
  });

  it('raises enemy HP and agility monotonically from a level 1 node to a level 10 node',()=>{
    expect(tacticalBattleNodeForStage('stage-9').level).toBe(1);
    expect(tacticalBattleNodeForStage('desert-1').level).toBe(10);
    const progression={power:60,magic:50,agility:30,maxHp:140};
    const low=createTacticalExpeditionBattle('stage-9',['bear','owl'],progression,7).units.filter(unit=>unit.side==='enemy');
    const high=createTacticalExpeditionBattle('desert-1',['bear','owl'],progression,7).units.filter(unit=>unit.side==='enemy');
    expect(low).toHaveLength(3);
    expect(high).toHaveLength(3);
    for(let index=0;index<3;index+=1){
      expect(high[index].maxHp).toBeGreaterThan(low[index].maxHp);
      expect(high[index].agility).toBeGreaterThan(low[index].agility);
      expect(Number.isFinite(high[index].maxHp)).toBe(true);
      expect(Number.isFinite(high[index].agility)).toBe(true);
    }
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
