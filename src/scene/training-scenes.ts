import type {ActivityId} from '../game-core';
import {resolveScene} from './scene-resolver';
import type {LocationId,ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

const trainingLocationByActivity:Record<ActivityId,LocationId>={
  hunt:'training_ground',
  magic:'magic_classroom',
  rest:'home',
  herb:'herb_garden',
};

export function trainingLocationForActivity(activity:ActivityId):LocationId{
  return trainingLocationByActivity[activity];
}

type TrainingSceneInput=SceneCalendarInput&{
  actorState?:SceneActorState;
  campaignId?:string|null;
  worldFacts?:readonly string[];
  inheritedWorldFacts?:readonly string[];
};

export function trainingSceneForActivity(activity:ActivityId,input:TrainingSceneInput):ResolvedScene{
  return resolveScene({
    ...input,
    location:trainingLocationForActivity(activity),
    activityId:activity,
  });
}
