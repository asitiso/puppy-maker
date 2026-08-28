import type {OutingLocationId} from '../adventure';
import {resolveScene} from './scene-resolver';
import type {ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

type OutingSceneInput=SceneCalendarInput&{
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
};

export function outingScene(location:OutingLocationId,input:OutingSceneInput):ResolvedScene{
  return resolveScene({...input,location});
}
