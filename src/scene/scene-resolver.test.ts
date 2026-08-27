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
});
