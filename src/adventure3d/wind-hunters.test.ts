import {describe,expect,it} from 'vitest';
import {SKIMMER_HOVER_HEIGHT,isAirborneEnemy,stepEnemyAi} from './enemy-ai';
import {
  createDawnreachFieldEnemies,
  createDawnreachWindHunters,
  isDawnreachWindHunter,
  mergeDawnreachWindHunters,
} from './wind-hunters';

const flat=()=>0;

describe('V18 Dawnreach aerial Windwalk hunters',()=>{
  it('spawns only after Windwalk unlock and starts above the terrain',()=>{
    expect(createDawnreachWindHunters(false)).toEqual([]);
    const hunters=createDawnreachWindHunters(true);
    expect(hunters).toHaveLength(2);
    expect(hunters.every(enemy=>enemy.archetype==='skimmer')).toBe(true);
    expect(hunters.every(enemy=>enemy.position.y>=SKIMMER_HOVER_HEIGHT)).toBe(true);
    expect(hunters.every(isAirborneEnemy)).toBe(true);
  });

  it('merges hunters idempotently into the existing Dawnreach encounter set',()=>{
    const hunters=createDawnreachWindHunters(true);
    const merged=mergeDawnreachWindHunters(hunters,true);
    expect(merged).toHaveLength(hunters.length);
    expect(new Set(merged.map(enemy=>enemy.id)).size).toBe(merged.length);
    expect(merged.every(isDawnreachWindHunter)).toBe(true);
  });

  it('keeps camp-clear persistence separate from transient aerial hunters',()=>{
    expect(createDawnreachFieldEnemies(false,false).length).toBeGreaterThan(0);
    expect(createDawnreachFieldEnemies(true,false)).toEqual([]);
    const unlockedAfterCamp=createDawnreachFieldEnemies(true,true);
    expect(unlockedAfterCamp).toHaveLength(2);
    expect(unlockedAfterCamp.every(isDawnreachWindHunter)).toBe(true);
  });

  it('dives toward strike height during windup and stays low through recovery',()=>{
    const hunter={
      ...createDawnreachWindHunters(true)[0],
      mode:'windup' as const,
      timer:.2,
      position:{x:0,y:SKIMMER_HOVER_HEIGHT,z:0},
    };
    const player={x:0,y:0,z:-1.5};
    const first=stepEnemyAi(hunter,player,.05,flat).enemy;
    expect(first.position.y).toBeLessThan(hunter.position.y);

    let current=first;
    let attack=null as ReturnType<typeof stepEnemyAi>['attack'];
    for(let i=0;i<8&&!attack;i++){
      const result=stepEnemyAi(current,player,.05,flat);
      current=result.enemy;
      attack=result.attack;
    }
    expect(current.mode).toBe('recover');
    expect(current.position.y).toBeLessThan(SKIMMER_HOVER_HEIGHT);
  });
});
