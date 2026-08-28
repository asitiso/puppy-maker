import type {Action} from '../../game-core';

export type TrainingPresentationResult='clean'|'close'|'miss';
export type TrainingKind='attack'|'dodge'|'charge';

export function trainingStepAction(kind:TrainingKind,accuracy:number):Extract<Action,{type:'TRAIN'}>{
  return {type:'TRAIN',kind,accuracy};
}

export function finishTrainingAction(eventRoll?:number,_presentation?:TrainingPresentationResult):Extract<Action,{type:'FINISH_TRAINING'}>{
  return eventRoll===undefined?{type:'FINISH_TRAINING'}:{type:'FINISH_TRAINING',eventRoll};
}
