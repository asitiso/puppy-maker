import {describe,expect,it} from 'vitest';
import {resolveActorVisual,resolveSceneVisualLayers} from './scene-asset-registry';

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
