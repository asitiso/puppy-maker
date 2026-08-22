import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';
import type {V3PersistentState} from './v3-persistent-state';
import type {WorldFactId} from './world-history';

export type FifthPathSeason='summer'|'autumn'|'winter';
export type FifthPathSeasonSource='echo_convergence'|'world_reweave'|'tactical_last_possibility';
export type FifthPathSeasonObjectiveId=
  | 'fifth_summer_echo_convergence'
  | 'fifth_autumn_world_reweave'
  | 'fifth_winter_last_possibility';

type FifthPathSeasonDefinition={
  season:FifthPathSeason;
  phase:FifthPathSeason;
  source:FifthPathSeasonSource;
  objectiveId:FifthPathSeasonObjectiveId;
  worldFact?:WorldFactId;
};

export const fifthPathSeasonDefinitions:readonly FifthPathSeasonDefinition[]=[
  {season:'summer',phase:'summer',source:'echo_convergence',objectiveId:'fifth_summer_echo_convergence',worldFact:'true_path_echoes_aligned'},
  {season:'autumn',phase:'autumn',source:'world_reweave',objectiveId:'fifth_autumn_world_reweave',worldFact:'true_path_world_rewoven'},
  {season:'winter',phase:'winter',source:'tactical_last_possibility',objectiveId:'fifth_winter_last_possibility'},
];

export type AcceptedFifthSeasonObjective={
  accepted:true;
  season:FifthPathSeason;
  source:FifthPathSeasonSource;
  objectiveId:FifthPathSeasonObjectiveId;
  claimKey:string;
  worldFact?:WorldFactId;
};

export function resolveFifthSeasonObjective(input:{
  year:unknown;
  season:unknown;
  source:unknown;
  state:V3PersistentState;
}):AcceptedFifthSeasonObjective|{accepted:false;reason:'invalid_context'|'already_claimed'}{
  const year=typeof input.year==='number'&&Number.isSafeInteger(input.year)&&input.year>=1?input.year:null;
  const definition=fifthPathSeasonDefinitions.find(item=>item.season===input.season&&item.source===input.source);
  if(!year||!definition||input.state.campaignRun.activeCampaign!=='true_path'||input.state.campaignRun.phase!==definition.phase){
    return {accepted:false,reason:'invalid_context'};
  }
  if(definition.season==='autumn'&&!input.state.campaignRun.seasonMilestones.includes('summer_resolved')){
    return {accepted:false,reason:'invalid_context'};
  }
  if(definition.season==='winter'&&!input.state.campaignRun.seasonMilestones.includes('autumn_resolved')){
    return {accepted:false,reason:'invalid_context'};
  }
  const claimKey=`${year}-${definition.season}:true_path:${definition.objectiveId}`;
  const claimed=sanitizeCampaignSeasonalObjectiveClaimKeys(input.state.campaignRun.claimedSeasonalObjectives);
  if(claimed.includes(claimKey))return {accepted:false,reason:'already_claimed'};
  return {
    accepted:true,
    season:definition.season,
    source:definition.source,
    objectiveId:definition.objectiveId,
    claimKey,
    ...(definition.worldFact?{worldFact:definition.worldFact}:{}),
  };
}

export function commitFifthSeasonObjective(state:V3PersistentState,result:AcceptedFifthSeasonObjective):
  | {committed:true;state:V3PersistentState}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_claimed'}{
  const current=resolveFifthSeasonObjective({year:Number(result.claimKey.split('-')[0]),season:result.season,source:result.source,state});
  if(!current.accepted){
    return {committed:false,state,reason:current.reason==='already_claimed'?'already_claimed':'not_ready'};
  }
  if(current.claimKey!==result.claimKey||current.objectiveId!==result.objectiveId){
    return {committed:false,state,reason:'not_ready'};
  }
  const claimedSeasonalObjectives=[...state.campaignRun.claimedSeasonalObjectives,current.claimKey];
  const seasonMilestones=[...state.campaignRun.seasonMilestones];
  let phase=state.campaignRun.phase;
  if(result.season==='summer'){
    if(!seasonMilestones.includes('summer_resolved'))seasonMilestones.push('summer_resolved');
    phase='autumn';
  }else if(result.season==='autumn'){
    if(!seasonMilestones.includes('autumn_resolved'))seasonMilestones.push('autumn_resolved');
    phase='winter';
  }
  const currentFacts=[...state.worldHistory.currentFacts];
  if(current.worldFact&&!currentFacts.includes(current.worldFact))currentFacts.push(current.worldFact);
  return {
    committed:true,
    state:{
      ...state,
      campaignRun:{...state.campaignRun,phase,seasonMilestones,claimedSeasonalObjectives},
      worldHistory:{...state.worldHistory,currentFacts},
    },
  };
}
