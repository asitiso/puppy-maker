import type {CampaignRunState} from './campaign-state';
import type {HollowDangerEvidenceId} from './campaign-model';
import {commitHollowDangerEvidence} from './hollow-danger';

export const hollowDangerActionIds=[
  'sacrifice_ally',
  'instrumentalize_bond',
  'prioritize_reward_over_civilians',
  'use_forbidden_relic',
  'depend_on_rift',
  'accept_veyr_power',
] as const;

export type HollowDangerActionId=typeof hollowDangerActionIds[number];
export type HollowDangerUtility=
  | {kind:'tactical_resource';resource:'ap'|'mp';amount:number}
  | {kind:'campaign_reward';resource:'gold';amount:number}
  | {kind:'season_progress';resource:'objective';amount:number};

export type HollowDangerActionDefinition={
  id:HollowDangerActionId;
  evidenceId:HollowDangerEvidenceId;
  utility:HollowDangerUtility;
};

const definitions:Record<HollowDangerActionId,HollowDangerActionDefinition>={
  sacrifice_ally:{
    id:'sacrifice_ally',
    evidenceId:'ally_sacrifice',
    utility:{kind:'tactical_resource',resource:'ap',amount:1},
  },
  instrumentalize_bond:{
    id:'instrumentalize_bond',
    evidenceId:'instrumental_bond',
    utility:{kind:'tactical_resource',resource:'mp',amount:1},
  },
  prioritize_reward_over_civilians:{
    id:'prioritize_reward_over_civilians',
    evidenceId:'civilian_tradeoff',
    utility:{kind:'campaign_reward',resource:'gold',amount:80},
  },
  use_forbidden_relic:{
    id:'use_forbidden_relic',
    evidenceId:'forbidden_relic',
    utility:{kind:'tactical_resource',resource:'mp',amount:2},
  },
  depend_on_rift:{
    id:'depend_on_rift',
    evidenceId:'rift_dependence',
    utility:{kind:'season_progress',resource:'objective',amount:1},
  },
  accept_veyr_power:{
    id:'accept_veyr_power',
    evidenceId:'veyr_power',
    utility:{kind:'tactical_resource',resource:'mp',amount:2},
  },
};

export function resolveHollowDangerAction(value:unknown):
  | {accepted:true;definition:HollowDangerActionDefinition}
  | {accepted:false;reason:'invalid_action'}{
  if(typeof value!=='string'||!(hollowDangerActionIds as readonly string[]).includes(value)){
    return {accepted:false,reason:'invalid_action'};
  }
  const id=value as HollowDangerActionId;
  return {accepted:true,definition:definitions[id]};
}

export function commitHollowDangerAction(state:CampaignRunState,value:unknown):
  | {committed:true;state:CampaignRunState;utility:HollowDangerUtility;definition:HollowDangerActionDefinition}
  | {committed:false;state:CampaignRunState;reason:'invalid_action'|'already_applied'}{
  const resolved=resolveHollowDangerAction(value);
  if(!resolved.accepted)return {committed:false,state,reason:'invalid_action'};
  const evidence=commitHollowDangerEvidence(state,resolved.definition.evidenceId);
  if(!evidence.committed){
    return {committed:false,state,reason:evidence.reason==='already_recorded'?'already_applied':'invalid_action'};
  }
  return {
    committed:true,
    state:evidence.state,
    utility:resolved.definition.utility,
    definition:resolved.definition,
  };
}
