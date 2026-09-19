import {describe,expect,it} from 'vitest';
import {
  ROADSIDE_AMBUSH,
  createRoadsideAmbushEnemies,
  isRoadsideAmbushEnemy,
  playerNearRoadsideAmbush,
  roadsideAmbushConsequence,
  roadsideAmbushDefeated,
  roadsideAmbushVisual,
  roadsideConsequenceMessage,
  playerNearWorldConsequence,
  shouldWitnessRoadsideAmbush,
} from './world-events';

describe('V18 Dawnreach living world events',()=>{
  it('stays unmarked until the player naturally enters the witness radius',()=>{
    const far={x:0,y:0,z:26};
    const near={x:ROADSIDE_AMBUSH.position.x+8,y:0,z:ROADSIDE_AMBUSH.position.z};
    expect(shouldWitnessRoadsideAmbush(far,false)).toBe(false);
    expect(shouldWitnessRoadsideAmbush(near,false)).toBe(true);
    expect(shouldWitnessRoadsideAmbush(near,true)).toBe(false);
    expect(playerNearRoadsideAmbush(near)).toBe(true);
  });

  it('spawns a self-contained encounter that can be resolved by ordinary combat',()=>{
    const enemies=createRoadsideAmbushEnemies();
    expect(enemies).toHaveLength(2);
    expect(enemies.every(enemy=>isRoadsideAmbushEnemy(enemy))).toBe(true);
    expect(enemies.every(enemy=>enemy.mode==='chase')).toBe(true);
    expect(roadsideAmbushDefeated(enemies)).toBe(false);
    const defeated=enemies.map(enemy=>({...enemy,hp:0,mode:'defeated' as const}));
    expect(roadsideAmbushDefeated(defeated)).toBe(true);
  });

  it('turns the saved outcome into a visible revisitable consequence',()=>{
    const rescued=roadsideAmbushConsequence('rescued');
    const passed=roadsideAmbushConsequence('passed');
    expect(rescued).toMatchObject({kind:'rescued-traveler',label:'구조된 여행자'});
    expect(passed).toMatchObject({kind:'abandoned-supplies',label:'버려진 짐'});
    expect(roadsideAmbushConsequence(undefined)).toBeNull();
    expect(playerNearWorldConsequence(rescued!.position,rescued)).toBe(true);
    expect(playerNearWorldConsequence({x:0,y:0,z:0},rescued)).toBe(false);
    expect(roadsideConsequenceMessage('rescued-traveler')).toContain('달이끼');
    expect(roadsideConsequenceMessage('abandoned-supplies')).toContain('재빛 야영지');
  });

  it('exposes a visual witness state without turning the event into a permanent map marker',()=>{
    expect(roadsideAmbushVisual('hidden')).toBeNull();
    expect(roadsideAmbushVisual('resolved')).toBeNull();
    expect(roadsideAmbushVisual('witnessed')).toMatchObject({
      id:'roadside-ambush',
      label:'길목 습격',
      phase:'witnessed',
    });
    expect(roadsideAmbushVisual('intervening')?.phase).toBe('intervening');
  });
});
