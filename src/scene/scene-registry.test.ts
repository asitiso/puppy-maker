import {describe,expect,it} from 'vitest';
import {LOCATION_IDS} from './scene-types';
import {SCENE_REGISTRY} from './scene-registry';

describe('V14 scene registry',()=>{
  it('contains exactly the nine approved living-world locations',()=>{
    expect(Object.keys(SCENE_REGISTRY).sort()).toEqual([...LOCATION_IDS].sort());
    expect(Object.keys(SCENE_REGISTRY)).toHaveLength(9);
  });
  it('exposes the core Home objects through scene interactions',()=>{
    const ids=SCENE_REGISTRY.home.interactions.map(item=>item.id);
    expect(ids).toEqual(expect.arrayContaining(['runa','bed','desk','wardrobe','bag','door','world_map']));
  });
});
