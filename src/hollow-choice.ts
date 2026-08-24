import type {CampaignRunState,HollowFinalChoiceResolution} from './campaign-state';
import {resolveHollowDangerState} from './hollow-danger';

export type HollowFinalChoice='accept'|'refuse'|'accept_hollow'|'refuse_hollow';
type CanonicalHollowFinalChoice='accept'|'refuse';

function normalizeHollowFinalChoice(choice:unknown):CanonicalHollowFinalChoice|null{
  if(choice==='accept'||choice==='accept_hollow')return 'accept';
  if(choice==='refuse'||choice==='refuse_hollow')return 'refuse';
  return null;
}

export function resolveHollowFinalChoice(state:CampaignRunState,choice:unknown):
  | {committed:true;state:CampaignRunState;resolution:HollowFinalChoiceResolution}
  | {committed:false;state:CampaignRunState;reason:'invalid_choice'|'not_available'|'already_resolved'}{
  if(state.dangerState.finalChoiceResolution){
    return {committed:false,state,reason:'already_resolved'};
  }
  const normalizedChoice=normalizeHollowFinalChoice(choice);
  if(!normalizedChoice){
    return {committed:false,state,reason:'invalid_choice'};
  }
  const danger=resolveHollowDangerState(state.dangerState);
  if(!danger.finalChoiceAvailable){
    return {committed:false,state,reason:'not_available'};
  }
  const resolution:HollowFinalChoiceResolution=normalizedChoice==='accept'?'accepted':'refused';
  return {
    committed:true,
    resolution,
    state:{
      ...state,
      activeRoute:normalizedChoice==='accept'?'hollow':state.activeRoute,
      dangerState:{...state.dangerState,finalChoiceResolution:resolution},
    },
  };
}
