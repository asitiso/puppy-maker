import {describe,expect,it} from 'vitest';
import {
  applyBurningHazardsToEnemies,
  createDryGrassPatch,
  igniteFieldHazard,
  spreadFieldFireWithWind,
  stepFieldHazards,
} from './environment-combat';
import type {AdventureEnemyState} from './enemy-ai';

const enemy=(x:number,z:number):AdventureEnemyState=>({
  id:'enemy',label:'enemy',archetype:'rusher',
  position:{x,y:0,z},home:{x,y:0,z},
  patrol:[{x,y:0,z}],patrolIndex:0,
  hp:42,maxHp:42,mode:'patrol',timer:0,facingYaw:0,lastHitAttackSerial:-1,
});

describe('V18 environment combat reactions',()=>{
  it('ignites only a dry patch the player is close enough and facing',()=>{
    const hazards=[
      createDryGrassPatch('front',{x:0,y:0,z:-5}),
      createDryGrassPatch('back',{x:0,y:0,z:5}),
    ];
    const result=igniteFieldHazard(hazards,{x:0,y:0,z:0},0);
    expect(result.affectedId).toBe('front');
    expect(result.hazards.find(item=>item.id==='front')?.burning).toBe(true);
    expect(result.hazards.find(item=>item.id==='back')?.burning).toBe(false);
  });

  it('uses wind direction to spread an existing fire instead of igniting every nearby patch',()=>{
    const hazards=[
      {...createDryGrassPatch('source',{x:0,y:0,z:-4}),burning:true,burnRemaining:5},
      createDryGrassPatch('downwind',{x:0,y:0,z:-11}),
      createDryGrassPatch('side',{x:8,y:0,z:-4}),
    ];
    const result=spreadFieldFireWithWind(hazards,{x:0,y:0,z:0},0);
    expect(result.sourceId).toBe('source');
    expect(result.spreadToId).toBe('downwind');
    expect(result.hazards.find(item=>item.id==='downwind')?.burning).toBe(true);
    expect(result.hazards.find(item=>item.id==='side')?.burning).toBe(false);
  });

  it('burns for a finite duration and becomes spent instead of permanent fire',()=>{
    let hazards=[{...createDryGrassPatch('grass',{x:0,y:0,z:0}),burning:true,burnRemaining:.08}];
    hazards=stepFieldHazards(hazards,.05).hazards;
    expect(hazards[0].burning).toBe(true);
    hazards=stepFieldHazards(hazards,.05).hazards;
    expect(hazards[0].burning).toBe(false);
    expect(hazards[0].spent).toBe(true);
  });

  it('turns fire into a tactical damage zone that also knocks enemies away from its center',()=>{
    const hazards=[{...createDryGrassPatch('grass',{x:0,y:0,z:0},4),burning:true,burnRemaining:5}];
    const target=enemy(1,0);
    const result=applyBurningHazardsToEnemies([target],hazards,10001);
    expect(result.damagedIds).toEqual(['enemy']);
    expect(result.enemies[0].hp).toBeLessThan(target.hp);
    expect(result.enemies[0].position.x).toBeGreaterThan(target.position.x);
    expect(result.enemies[0].mode).toBe('stagger');
  });

  it('does not damage enemies outside burning terrain',()=>{
    const hazards=[{...createDryGrassPatch('grass',{x:0,y:0,z:0},3),burning:true,burnRemaining:5}];
    const target=enemy(10,0);
    const result=applyBurningHazardsToEnemies([target],hazards,10001);
    expect(result.damagedIds).toEqual([]);
    expect(result.enemies[0]).toEqual(target);
  });
});
