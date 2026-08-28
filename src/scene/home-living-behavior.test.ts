import {describe,expect,it} from 'vitest';
import {resolveActorVisual} from './scene-asset-registry';
import {resolveCompanionAmbient,resolveHomeAmbientBehavior} from './home-living-behavior';

describe('V14 living Home ambient behavior',()=>{
  it('prioritizes visible state reactions over autonomous wandering',()=>{
    const tired=resolveHomeAmbientBehavior({condition:'tired',year:1,month:3,week:2});
    const focused=resolveHomeAmbientBehavior({condition:'focused',year:1,month:3,week:2});
    expect(tired.anchorId).toBe('bed');
    expect(focused.anchorId).toBe('desk');
    expect(resolveActorVisual('runa',tired.pose).resolvedPose).toBe(tired.pose);
    expect(resolveActorVisual('runa',focused.pose).resolvedPose).toBe(focused.pose);
    expect(focused.pose).not.toBe('idle');
  });

  it('is deterministic for equal canonical calendar and actor inputs',()=>{
    const input={condition:'good',personality:'curious',year:2,month:7,week:4};
    const behavior=resolveHomeAmbientBehavior(input);
    expect(behavior).toEqual(resolveHomeAmbientBehavior(input));
    expect(['runa','desk','world_map']).toContain(behavior.anchorId);
    expect(resolveActorVisual('runa',behavior.pose).resolvedPose).toBe(behavior.pose);
    expect(behavior.pose).not.toBe('idle');
  });

  it('keeps companion identity presentation distinct without returning gameplay state',()=>{
    expect(resolveCompanionAmbient({actorId:'bear',bondLevel:3}).anchorBias).toBe('near');
    expect(resolveCompanionAmbient({actorId:'owl',bondLevel:3}).anchorBias).toBe('watch');
    expect(resolveCompanionAmbient({actorId:'wolf',bondLevel:3}).anchorBias).toBe('forward');
    expect(resolveCompanionAmbient({actorId:'cat',bondLevel:3}).anchorBias).toBe('prop');
    expect(resolveCompanionAmbient({actorId:'owl',bondLevel:3})).toEqual(resolveCompanionAmbient({actorId:'owl',bondLevel:3}));
  });
});
