import {describe,expect,it} from 'vitest';
import {villageStoryFrames,villageWorld} from './village-world';
import {lakesideStoryFrames,lakesideWorld} from './lakeside-world';

describe('mobile RPG regional worlds',()=>{
  it('builds the magic village as a larger walkable street map instead of a card scene',()=>{
    expect(villageWorld.id).toBe('magic-village');
    expect(villageWorld.width).toBeGreaterThanOrEqual(2200);
    expect(villageWorld.height).toBeGreaterThanOrEqual(1400);
    expect(villageWorld.layers.map(layer=>layer.src).join(' ')).toContain('/assets/exploration/village/');
    expect(villageWorld.interactables.map(item=>item.id)).toEqual(expect.arrayContaining(['village-exit','village-square','street-performance','wand-repair','quiet-alley']));
    expect(villageStoryFrames['village-performance']?.progression).toBe(true);
    expect(villageStoryFrames['village-repair']?.progression).toBe(false);
  });

  it('builds the lakeside around shoreline discovery and wind landmarks',()=>{
    expect(lakesideWorld.id).toBe('wind-lakeside');
    expect(lakesideWorld.width).toBeGreaterThanOrEqual(2200);
    expect(lakesideWorld.height).toBeGreaterThanOrEqual(1400);
    expect(lakesideWorld.layers.map(layer=>layer.src).join(' ')).toContain('/assets/exploration/lakeside/');
    expect(lakesideWorld.interactables.map(item=>item.id)).toEqual(expect.arrayContaining(['lakeside-exit','water-edge','silver-fish','resting-stone','wind-crystal']));
    expect(lakesideStoryFrames['lakeside-fish']?.progression).toBe(true);
    expect(lakesideStoryFrames['lakeside-crystal']?.progression).toBe(false);
  });

  it('uses distinct objectives and collision layouts so regions do not feel like reskins',()=>{
    expect(villageWorld.objective).not.toBe(lakesideWorld.objective);
    expect(villageWorld.obstacles).not.toEqual(lakesideWorld.obstacles);
    expect(villageWorld.start).not.toEqual(lakesideWorld.start);
  });
});
