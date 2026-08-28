import {describe,expect,it} from 'vitest';
import {resolveScene} from './scene-resolver';

describe('V14 contextual actor reactions outside Home',()=>{
  it('puts Runa into activity-ready choreography in each training place',()=>{
    const hunt=resolveScene({year:1,month:4,week:1,location:'training_ground',activityId:'hunt'}).cast.find(actor=>actor.actorId==='runa');
    const magic=resolveScene({year:1,month:4,week:1,location:'magic_classroom',activityId:'magic'}).cast.find(actor=>actor.actorId==='runa');
    const herb=resolveScene({year:1,month:4,week:1,location:'herb_garden',activityId:'herb'}).cast.find(actor=>actor.actorId==='runa');
    expect(hunt?.pose).toBe('training-ready');
    expect(magic?.pose).toBe('focus');
    expect(herb?.pose).toBe('inspect');
    expect([hunt?.motion,magic?.motion,herb?.motion]).not.toEqual(['idle','idle','idle']);
  });

  it('reacts to hazardous world context without changing canonical state',()=>{
    const scene=resolveScene({year:2,month:10,week:3,location:'forest',worldFacts:['rift_unstable'],actorState:{condition:'normal',personality:'brave'}});
    const runa=scene.cast.find(actor=>actor.actorId==='runa');
    expect(runa?.pose).toBe('alert');
    expect(scene.presentationTags).toContain('actor-reaction:alert');
    expect(JSON.stringify(scene)).not.toMatch(/statDelta|rewardAmount|bondGain/);
  });
});
