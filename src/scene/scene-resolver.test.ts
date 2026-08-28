import {describe,expect,it} from 'vitest';
import {resolveScene} from './scene-resolver';

describe('V14 pure scene resolver',()=>{
  it('lets Story override weekly weather',()=>{
    const scene=resolveScene({year:1,month:4,week:2,location:'home',storyEventId:'quiet_rain'});
    expect(scene.weather).toBe('rain');
    expect(scene.presentationTags).toContain('story:quiet_rain');
  });
  it('falls malformed requested locations back to Home',()=>{
    const scene=resolveScene({year:1,month:4,week:2,location:'not-a-real-place'});
    expect(scene.location).toBe('home');
    expect(scene.id).toBe('location:home');
  });
  it('is deterministic for equal meaningful inputs',()=>{
    const request={year:2,month:8,week:3,location:'forest',worldFacts:['village_alliance'],actorState:{condition:'tired'}} as const;
    expect(resolveScene(request)).toEqual(resolveScene(request));
  });
  it('derives Home Runa presentation from canonical actor state and calendar',()=>{
    const tired=resolveScene({year:1,month:3,week:2,location:'home',actorState:{condition:'tired'}});
    const focused=resolveScene({year:1,month:3,week:2,location:'home',actorState:{condition:'focused'}});
    expect(tired.cast.find(actor=>actor.actorId==='runa')).toMatchObject({anchorId:'bed',pose:'tired'});
    expect(focused.cast.find(actor=>actor.actorId==='runa')).toMatchObject({anchorId:'desk',pose:'training-ready'});
  });
});
