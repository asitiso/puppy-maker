import {describe,expect,it} from 'vitest';
import type {ResolvedScene} from './scene-types';
import {advanceSceneRuntime,beginSceneInteraction,createSceneRuntime} from './scene-runtime';
import {claimSceneDirectorCommit} from './SceneDirector';

const scene:ResolvedScene={
  id:'home:default',
  location:'home',
  season:'spring',
  timeOfDay:'day',
  weather:'clear',
  anchors:[{id:'bed',x:10,y:20}],
  backgroundLayers:[],
  cast:[],
  interactions:[{id:'bed',label:'Rest',mode:'rest',anchorId:'bed',enabled:true,hint:'none'}],
  beats:[],
  presentationTags:[],
};

describe('V14 SceneDirector commit boundary',()=>{
  it('resolves an enabled canonical interaction exactly once',()=>{
    const committing=advanceSceneRuntime(advanceSceneRuntime(beginSceneInteraction(createSceneRuntime(),'bed')));
    const first=claimSceneDirectorCommit(scene,committing);
    expect(first.interaction?.id).toBe('bed');
    expect(first.runtime.commitClaimed).toBe(true);

    const duplicate=claimSceneDirectorCommit(scene,first.runtime);
    expect(duplicate.interaction).toBeNull();
    expect(duplicate.runtime).toEqual(first.runtime);
  });

  it('claims the boundary without emitting a disabled interaction',()=>{
    const disabledScene:ResolvedScene={
      ...scene,
      interactions:[{...scene.interactions[0],enabled:false}],
    };
    const committing=advanceSceneRuntime(advanceSceneRuntime(beginSceneInteraction(createSceneRuntime(),'bed')));
    const result=claimSceneDirectorCommit(disabledScene,committing);
    expect(result.interaction).toBeNull();
    expect(result.runtime.commitClaimed).toBe(true);
  });
});
