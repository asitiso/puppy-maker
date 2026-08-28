import {describe,expect,it} from 'vitest';
import {resolveCompanionAmbient,resolveHomeAmbientBehavior} from './home-living-behavior';

describe('V14 living Home ambient behavior',()=>{
  it('prioritizes visible state reactions over autonomous wandering',()=>{
    expect(resolveHomeAmbientBehavior({condition:'tired',year:1,month:3,week:2}).anchorId).toBe('bed');
    expect(resolveHomeAmbientBehavior({condition:'focused',year:1,month:3,week:2}).anchorId).toBe('desk');
  });

  it('is deterministic for equal canonical calendar and actor inputs',()=>{
    const input={condition:'good',personality:'curious',year:2,month:7,week:4};
    expect(resolveHomeAmbientBehavior(input)).toEqual(resolveHomeAmbientBehavior(input));
    expect(['runa','desk','world_map']).toContain(resolveHomeAmbientBehavior(input).anchorId);
  });

  it('keeps companion identity presentation distinct without returning gameplay state',()=>{
    expect(resolveCompanionAmbient({actorId:'bear',bondLevel:3}).anchorBias).toBe('near');
    expect(resolveCompanionAmbient({actorId:'owl',bondLevel:3}).anchorBias).toBe('watch');
    expect(resolveCompanionAmbient({actorId:'wolf',bondLevel:3}).anchorBias).toBe('forward');
    expect(resolveCompanionAmbient({actorId:'cat',bondLevel:3}).anchorBias).toBe('prop');
    expect(resolveCompanionAmbient({actorId:'owl',bondLevel:3})).toEqual(resolveCompanionAmbient({actorId:'owl',bondLevel:3}));
  });
});
