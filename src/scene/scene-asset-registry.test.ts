import {describe,expect,it} from 'vitest';
import {resolveActorVisual,resolveSceneVisualLayers} from './scene-asset-registry';
import {LOCATION_IDS} from './scene-types';

describe('V14 layered scene asset registry',()=>{
  it('always resolves a base layer and treats unavailable variants as optional tokens',()=>{
    const layers=resolveSceneVisualLayers({
      location:'forest',season:'autumn',timeOfDay:'night',weather:'rain',worldFacts:['festival_restored'],
    });
    expect(layers[0]).toMatchObject({kind:'base',token:'location:forest'});
    expect(layers).toEqual(expect.arrayContaining([
      expect.objectContaining({kind:'season',token:'season:autumn'}),
      expect.objectContaining({kind:'lighting',token:'lighting:night'}),
      expect.objectContaining({kind:'weather',token:'weather:rain'}),
    ]));
    expect(()=>resolveSceneVisualLayers({location:'forest',season:'autumn',timeOfDay:'night',weather:'rain',worldFacts:['unknown_fact']})).not.toThrow();
  });

  it('backs every playable scene location with a concrete repository image',()=>{
    for(const location of LOCATION_IDS){
      const [base]=resolveSceneVisualLayers({
        location,season:'spring',timeOfDay:'day',weather:'clear',
      });
      expect(base).toMatchObject({kind:'base',token:`location:${location}`});
      expect(base.src, location).toMatch(/^\/assets\/.+\.(?:webp|png)$/);
    }
  });

  it('uses location-specific images instead of one generic background for core living-world spaces',()=>{
    const srcFor=(location:'training_ground'|'magic_classroom'|'forest'|'village')=>
      resolveSceneVisualLayers({location,season:'spring',timeOfDay:'day',weather:'clear'})[0].src;
    expect(srcFor('training_ground')).toContain('/assets/training/');
    expect(srcFor('magic_classroom')).toContain('/assets/training/magic_training_bg.webp');
    expect(srcFor('forest')).toContain('/assets/outing/forest_walk_bg.webp');
    expect(srcFor('village')).toContain('/assets/outing/village_bg.webp');
    expect(new Set([
      srcFor('training_ground'),srcFor('magic_classroom'),srcFor('forest'),srcFor('village'),
    ]).size).toBe(4);
  });

  it('falls missing Runa actions back to idle without mutating game state',()=>{
    expect(resolveActorVisual('runa','dance')).toMatchObject({
      actorId:'runa',requestedPose:'dance',resolvedPose:'idle',slot:'home.hero',
    });
  });

  it('falls missing companion poses back to the current companion portrait slot',()=>{
    expect(resolveActorVisual('cat','celebrate')).toMatchObject({
      actorId:'cat',requestedPose:'celebrate',resolvedPose:'idle',slot:'companion.cat.portrait',
    });
  });
});
