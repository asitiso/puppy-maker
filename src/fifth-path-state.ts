import {resolveFifthPathEligibility} from './fifth-path-eligibility';
import type {V3PersistentState} from './v3-persistent-state';

export function commitTruePath(state:V3PersistentState):
  | {committed:true;state:V3PersistentState}
  | {committed:false;state:V3PersistentState;reason:'ineligible'|'not_ready'}{
  const run=state.campaignRun;
  if(
    run.phase!=='spring_exploration'||
    run.activeCampaign!==null||
    run.activeRoute!=='normal'||
    run.seasonMilestones.includes('path_convergence')
  ){
    return {committed:false,state,reason:'not_ready'};
  }
  if(!resolveFifthPathEligibility(state.legacy).eligible){
    return {committed:false,state,reason:'ineligible'};
  }
  return {
    committed:true,
    state:{
      ...state,
      campaignRun:{
        ...run,
        activeCampaign:'true_path',
        phase:'summer',
        seasonMilestones:[...run.seasonMilestones,'path_convergence'],
      },
    },
  };
}
