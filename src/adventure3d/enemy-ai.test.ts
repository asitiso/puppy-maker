import {describe,expect,it} from 'vitest';
import {alertNearbyEnemies,applyEnemyDamage,canEnemySeePlayer,stepEnemyAi,type AdventureEnemyState} from './enemy-ai';

const flat=()=>0;
const enemy=(patch:Partial<AdventureEnemyState>={}):AdventureEnemyState=>({
  id:'test-enemy',
  label:'test',
  archetype:'rusher',
  position:{x:0,y:0,z:0},
  home:{x:0,y:0,z:0},
  patrol:[{x:0,y:0,z:0},{x:3,y:0,z:0}],
  patrolIndex:1,
  hp:42,
  maxHp:42,
  mode:'patrol',
  timer:0,
  facingYaw:0,
  lastHitAttackSerial:-1,
  ...patch,
});

describe('V18 perception-driven enemy AI',()=>{
  it('does not aggro a distant player through the entire field',()=>{
    expect(canEnemySeePlayer(enemy(),{x:0,y:0,z:40})).toBe(false);
    const result=stepEnemyAi(enemy(),{x:0,y:0,z:40},.05,flat);
    expect(result.enemy.mode).toBe('patrol');
    expect(result.attack).toBeNull();
  });

  it('uses suspicious state before chase instead of instant attacking',()=>{
    const first=stepEnemyAi(enemy(),{x:0,y:0,z:-10},.05,flat);
    expect(first.enemy.mode).toBe('suspicious');
    let current=first.enemy;
    for(let i=0;i<10;i++)current=stepEnemyAi(current,{x:0,y:0,z:-10},.05,flat).enemy;
    expect(current.mode).toBe('chase');
  });

  it('telegraphs an attack before emitting damage',()=>{
    let current=enemy({mode:'chase',position:{x:0,y:0,z:0}});
    const player={x:0,y:0,z:-1.5};
    let result=stepEnemyAi(current,player,.05,flat);
    expect(result.enemy.mode).toBe('windup');
    expect(result.attack).toBeNull();
    current=result.enemy;
    let attack=null as ReturnType<typeof stepEnemyAi>['attack'];
    for(let i=0;i<20&&!attack;i++){
      result=stepEnemyAi(current,player,.05,flat);
      current=result.enemy;
      attack=result.attack;
    }
    expect(attack).not.toBeNull();
    expect(current.mode).toBe('recover');
  });

  it('returns toward its authored home when pulled beyond the leash',()=>{
    const pulled=enemy({mode:'chase',position:{x:30,y:0,z:0}});
    const result=stepEnemyAi(pulled,{x:40,y:0,z:0},.05,flat);
    expect(result.enemy.mode).toBe('return');
  });

  it('alerts nearby camp members when combat breaks out',()=>{
    const fighting=enemy({id:'a',mode:'chase'});
    const nearby=enemy({id:'b',position:{x:4,y:0,z:0},home:{x:4,y:0,z:0}});
    const far=enemy({id:'c',position:{x:20,y:0,z:0},home:{x:20,y:0,z:0}});
    const alerted=alertNearbyEnemies([fighting,nearby,far]);
    expect(alerted.find(item=>item.id==='b')?.mode).toBe('suspicious');
    expect(alerted.find(item=>item.id==='c')?.mode).toBe('patrol');
  });

  it('takes one hit per player attack serial and enters stagger before defeat',()=>{
    const first=applyEnemyDamage(enemy(),18,1);
    expect(first.damaged).toBe(true);
    expect(first.enemy.mode).toBe('stagger');
    const duplicate=applyEnemyDamage(first.enemy,18,1);
    expect(duplicate.damaged).toBe(false);
    expect(duplicate.enemy.hp).toBe(24);
    const final=applyEnemyDamage(duplicate.enemy,30,2);
    expect(final.defeated).toBe(true);
    expect(final.enemy.mode).toBe('defeated');
  });
});
