import {describe,expect,it} from 'vitest';
import {
  CLOUD_GARDEN,
  cloudGardenEnemiesDefeated,
  cloudGardenOutsideEntrancePosition,
  cloudGardenVisual,
  constrainCloudGardenPlayer,
  createCloudGardenEnemies,
  createCloudGardenState,
  enterCloudGarden,
  playerNearCloudGardenOutsideEntrance,
  restoreCloudGarden,
} from './cloud-garden';

describe('V18 Cloud Garden secret pocket',()=>{
  it('requires Windwalk mastery to expose the west-ridge entrance',()=>{
    const entrance=cloudGardenOutsideEntrancePosition();
    expect(playerNearCloudGardenOutsideEntrance(entrance,false)).toBe(false);
    expect(playerNearCloudGardenOutsideEntrance(entrance,true)).toBe(true);
  });

  it('starts as a bounded elevated pocket with three storm guardians',()=>{
    const state=enterCloudGarden(createCloudGardenState(false));
    const enemies=createCloudGardenEnemies(false);
    expect(state.inside).toBe(true);
    expect(enemies).toHaveLength(3);
    const clamped=constrainCloudGardenPlayer({x:999,y:-20,z:-999});
    expect(Math.abs(clamped.x)).toBeLessThanOrEqual(CLOUD_GARDEN.halfSize);
    expect(Math.abs(clamped.z)).toBeLessThanOrEqual(CLOUD_GARDEN.halfSize);
    expect(clamped.y).toBeGreaterThan(8);
  });

  it('does not consider the garden clear until every authored guardian is defeated',()=>{
    const enemies=createCloudGardenEnemies(false);
    expect(cloudGardenEnemiesDefeated(enemies)).toBe(false);
    const defeated=enemies.map(enemy=>({...enemy,hp:0,mode:'defeated' as const}));
    expect(cloudGardenEnemiesDefeated(defeated)).toBe(true);
  });

  it('turns restoration into a stable no-enemy state',()=>{
    let state=enterCloudGarden(createCloudGardenState(false));
    state=restoreCloudGarden(state);
    expect(state.restored).toBe(true);
    expect(createCloudGardenEnemies(true)).toEqual([]);
    const visual=cloudGardenVisual(state,{x:0,y:10,z:-10},[]);
    expect(visual?.restored).toBe(true);
    expect(visual?.enemiesDefeated).toBe(true);
  });
});
