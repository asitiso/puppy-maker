import {describe,expect,it} from 'vitest';
import {reconcileActivityCheckpoint,sanitizeActivityCheckpoint} from './activity-checkpoint';
import {emptyV3PersistentState,hydrateV3PersistentState,prepareNewRunState} from '../v3-persistent-state';

describe('V14 semantic activity checkpoints',()=>{
  it('accepts semantic Story phases and rejects animation-frame phases',()=>{
    expect(sanitizeActivityCheckpoint({activity:'story',activityId:'lost_bird',phase:'choice',step:'choice:help'})).toEqual({
      activity:'story',activityId:'lost_bird',phase:'choice',step:'choice:help',
    });
    expect(sanitizeActivityCheckpoint({activity:'story',activityId:'lost_bird',phase:'frame-27',step:'choice:help'})).toBeNull();
  });

  it('rejects an empty Expedition semantic node',()=>{
    expect(sanitizeActivityCheckpoint({activity:'expedition',activityId:'guardian-expedition',phase:'node',step:''})).toBeNull();
  });

  it('trusts post-commit boundaries only when canonical state proves the commit',()=>{
    const checkpoint={activity:'training',activityId:'magic',phase:'post_commit',step:'result'} as const;
    expect(reconcileActivityCheckpoint(checkpoint,false)).toEqual({...checkpoint,phase:'activity'});
    expect(reconcileActivityCheckpoint(checkpoint,true)).toEqual(checkpoint);
  });

  it('hydrates only semantic checkpoint fields and remains backward-compatible',()=>{
    const hydrated=hydrateV3PersistentState({
      sceneCheckpoint:{activity:'story',activityId:'lost_bird',phase:'choice',step:'choice:help',actorX:72,cameraOffset:14},
    });
    expect(hydrated.sceneCheckpoint).toEqual({activity:'story',activityId:'lost_bird',phase:'choice',step:'choice:help'});
    expect(hydrated.sceneCheckpoint).not.toHaveProperty('actorX');
    expect(hydrated.sceneCheckpoint).not.toHaveProperty('cameraOffset');
    expect(hydrateV3PersistentState({}).sceneCheckpoint).toBeNull();
    expect(hydrateV3PersistentState({sceneCheckpoint:{activity:'expedition',activityId:'guardian-expedition',phase:'node',step:''}}).sceneCheckpoint).toBeNull();
  });

  it('defaults and new-run boundaries do not carry a stale scene checkpoint',()=>{
    expect(emptyV3PersistentState().sceneCheckpoint).toBeNull();
    const current={
      ...emptyV3PersistentState(),
      sceneCheckpoint:{activity:'training',activityId:'magic',phase:'activity',step:'casting'} as const,
    };
    expect(prepareNewRunState(current).sceneCheckpoint).toBeNull();
  });
});
