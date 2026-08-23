import type {CampaignRunState,HollowFinalChoiceResolution} from './campaign-state';
import {resolveHollowDangerState} from './hollow-danger';

export type HollowFinalChoice='accept'|'refuse';

export function resolveHollowFinalChoice(state:CampaignRunState,choice:unknown):
  | {committed:true;state:CampaignRunState;resolution:HollowFinalChoiceResolution}
  | {committed:false;state:CampaignRunState;reason:'invalid_choice'|'not_available'|'already_resolved'}{
  if(state.dangerState.finalChoiceResolution){
    return {committed:false,state,reason:'already_resolved'};
  }
  if(choice!=='accept'&&choice!=='refuse'){
    return {committed:false,state,reason:'invalid_choice'};
  }
  const danger=resolveHollowDangerState(state.dangerState);
  if(!danger.finalChoiceAvailable){
    return {committed:false,state,reason:'not_available'};
  }
  const resolution:HollowFinalChoiceResolution=choice==='accept'?'accepted':'refused';
  return {
    committed:true,
    resolution,
    state:{
      ...state,
      activeRoute:choice==='accept'?'hollow':state.activeRoute,
      dangerState:{...state.dangerState,finalChoiceResolution:resolution},
    },
  };
}
