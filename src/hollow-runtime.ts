import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';
import type {CampaignMilestoneId} from './campaign-model';
import type {V3PersistentState} from './v3-persistent-state';
import type {WorldFactId} from './world-history';

export type HollowSeason='summer'|'autumn'|'winter';
export type HollowSeasonSource='predatory_shortcut'|'rift_bargain'|'veyr_convergence';
export type HollowSeasonObjectiveId=
  | 'hollow_summer_predatory_shortcut'
  | 'hollow_autumn_rift_bargain'
  | 'hollow_winter_veyr_convergence';

export type HollowSeasonDefinition={
  season:HollowSeason;
  source:HollowSeasonSource;
  objectiveId:HollowSeasonObjectiveId;
  worldFact?:WorldFactId;
};

export const hollowSeasonDefinitions:readonly HollowSeasonDefinition[]=[
  {
    season:'summer',
    source:'predatory_shortcut',
    objectiveId:'hollow_summer_predatory_shortcut',
    worldFact:'hollow_shortcut_taken',
  },
  {
    season:'autumn',
    source:'rift_bargain',
    objectiveId:'hollow_autumn_rift_bargain',
    worldFact:'hollow_rift_entrenched',
  },
  {
    season:'winter',
    source:'veyr_convergence',
    objectiveId:'hollow_winter_veyr_convergence',
  },
] as const;

export type AcceptedHollowSeasonObjective={
  accepted:true;
  season:HollowSeason;
  source:HollowSeasonSource;
  objectiveId:HollowSeasonObjectiveId;
  claimKey:string;
  worldFact?:WorldFactId;
};

function canonicalYear(value:unknown):number|null{
  return typeof value==='number'&&Number.isSafeInteger(value)&&value>=1?value:null;
}

function seasonReady(state:V3PersistentState,season:HollowSeason):boolean{
  const run=state.campaignRun;
  if(run.activeRoute!=='hollow'||run.dangerState.finalChoiceResolution!=='accepted'||run.phase!==season)return false;
  if(season==='autumn'&&!run.seasonMilestones.includes('summer_resolved'))return false;
  if(season==='winter'&&!run.seasonMilestones.includes('autumn_resolved'))return false;
  return true;
}

export function resolveHollowSeasonObjective(input:{
  year:unknown;
  season:unknown;
  source:unknown;
  state:V3PersistentState;
}):AcceptedHollowSeasonObjective|{accepted:false;reason:'invalid_context'|'already_claimed'}{
  const year=canonicalYear(input.year);
  const definition=hollowSeasonDefinitions.find(item=>item.season===input.season&&item.source===input.source);
  if(!year||!definition||!seasonReady(input.state,definition.season)){
    return {accepted:false,reason:'invalid_context'};
  }
  const claimKey=`${year}-${definition.season}:hollow:${definition.objectiveId}`;
  if(input.state.campaignRun.claimedSeasonalObjectives.includes(claimKey)){
    return {accepted:false,reason:'already_claimed'};
  }
  return {
    accepted:true,
    season:definition.season,
    source:definition.source,
    objectiveId:definition.objectiveId,
    claimKey,
    ...(definition.worldFact?{worldFact:definition.worldFact}:{}),
  };
}

export function commitHollowSeasonObjective(state:V3PersistentState,result:AcceptedHollowSeasonObjective):
  | {committed:true;state:V3PersistentState}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_claimed'}{
  if(state.campaignRun.claimedSeasonalObjectives.includes(result.claimKey)){
    return {committed:false,state,reason:'already_claimed'};
  }
  if(!seasonReady(state,result.season))return {committed:false,state,reason:'not_ready'};
  const expected=hollowSeasonDefinitions.find(item=>item.season===result.season&&item.source===result.source);
  if(!expected||expected.objectiveId!==result.objectiveId||expected.worldFact!==result.worldFact){
    return {committed:false,state,reason:'not_ready'};
  }
  const claims=sanitizeCampaignSeasonalObjectiveClaimKeys([
    ...state.campaignRun.claimedSeasonalObjectives,
    result.claimKey,
  ]);
  if(!claims.includes(result.claimKey))return {committed:false,state,reason:'not_ready'};

  let phase=state.campaignRun.phase;
  let milestone:CampaignMilestoneId|undefined;
  if(result.season==='summer'){
    phase='autumn';
    milestone='summer_resolved';
  }else if(result.season==='autumn'){
    phase='winter';
    milestone='autumn_resolved';
  }
  const seasonMilestones=milestone&&!state.campaignRun.seasonMilestones.includes(milestone)
    ? [...state.campaignRun.seasonMilestones,milestone]
    : state.campaignRun.seasonMilestones;
  const currentFacts=result.worldFact&&!state.worldHistory.currentFacts.includes(result.worldFact)
    ? [...state.worldHistory.currentFacts,result.worldFact]
    : state.worldHistory.currentFacts;

  return {
    committed:true,
    state:{
      ...state,
      campaignRun:{
        ...state.campaignRun,
        phase,
        seasonMilestones,
        claimedSeasonalObjectives:claims,
      },
      worldHistory:{
        currentFacts,
        inheritedFacts:[...state.worldHistory.inheritedFacts],
      },
    },
  };
}
