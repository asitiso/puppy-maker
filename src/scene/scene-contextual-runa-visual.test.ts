import {describe,expect,it} from 'vitest';
import {resolveActorVisual} from './scene-asset-registry';
import {resolveScene} from './scene-resolver';

describe('V14 contextual Runa visual reactions',()=>{
  it.each([
    ['magic focus',{location:'magic_classroom',activityId:'magic'}],
    ['herb inspection',{location:'herb_garden',activityId:'herb'}],
    ['world danger',{location:'forest',worldFacts:['rift_unstable']}],
    ['outing curiosity',{location:'forest',actorState:{personality:'curious'}}],
  ] as const)('%s resolves to a real non-idle Runa pose',(_label,request)=>{
    const scene=resolveScene({year:1,month:5,week:2,...request});
    const actor=scene.cast.find(item=>item.actorId==='runa');
    expect(actor).toBeDefined();
    const visual=resolveActorVisual('runa',actor?.pose);
    expect(visual.resolvedPose).toBe(actor?.pose);
    expect(visual.resolvedPose).not.toBe('idle');
    expect(visual.src).toMatch(/^\/assets\/runa\/.+\.webp$/);
  });
});
