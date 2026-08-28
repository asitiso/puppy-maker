import {describe,expect,it} from 'vitest';
import {finishTrainingAction,trainingStepAction} from './raising-adapter';

describe('V14 raising scene adapter',()=>{
  it('forwards training inputs to the current canonical TRAIN action',()=>{
    expect(trainingStepAction('attack',0.72)).toEqual({type:'TRAIN',kind:'attack',accuracy:0.72});
    expect(trainingStepAction('dodge',0.4)).toEqual({type:'TRAIN',kind:'dodge',accuracy:0.4});
  });

  it('keeps minigame presentation labels out of durable completion payloads',()=>{
    expect(finishTrainingAction(0.25,'clean')).toEqual({type:'FINISH_TRAINING',eventRoll:0.25});
    expect(finishTrainingAction(0.25,'miss')).toEqual({type:'FINISH_TRAINING',eventRoll:0.25});
    expect(Object.keys(finishTrainingAction(0.25,'close')).sort()).toEqual(['eventRoll','type']);
  });
});
