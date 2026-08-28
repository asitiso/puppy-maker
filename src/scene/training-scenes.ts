import type {ActivityId} from '../game-core';
import {resolveScene} from './scene-resolver';
import type {LocationId,ResolvedScene,SceneActorState,SceneCalendarInput} from './scene-types';

export type SceneTrainingActivity=Exclude<ActivityId,'rest'>;

const trainingLocationByPlayable:Record<SceneTrainingActivity,LocationId>={
  hunt:'training_ground',
  magic:'magic_classroom',
  herb:'herb_garden',
};

const primaryInteractionByTraining:Record<SceneTrainingActivity,string>={
  hunt:'dummy',
  magic:'circle',
  herb:'workbench',
};

export function sceneLocationForTraining(activity:SceneTrainingActivity):LocationId{
  return trainingLocationByPlayable[activity];
}

export function primaryTrainingInteraction(activity:SceneTrainingActivity):string{
  return primaryInteractionByTraining[activity];
}

export function trainingLocationForActivity(activity:ActivityId):LocationId{
  return activity==='rest'?'home':sceneLocationForTraining(activity);
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
