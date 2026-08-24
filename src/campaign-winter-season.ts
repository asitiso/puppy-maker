import {
  campaignIds,
  mainCampaignIds,
  majorOutcomeResults,
  type CampaignId,
  type MainCampaignId,
  type MajorOutcomeResult,
} from './campaign-model';
import type {CampaignRunState} from './campaign-state';
import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';
import {hydrateLegacyState,type TruePathEvidenceId} from './legacy-state';
import type {V3PersistentState} from './v3-persistent-state';

export type WinterCampaignActionFact=
  | 'long_night_protection'
  | 'responsibility_sharing'
  | 'long_night_route'
  | 'route_knowledge'
  | 'long_night_command'
  | 'elite_chain'
  | 'long_night_reality'
  | 'rift_control';

const mainCampaignSet=new Set<string>(mainCampaignIds);
const campaignSet=new Set<string>(campaignIds);
const winterFactSet=new Set<string>([
  'long_night_protection','responsibility_sharing','long_night_route','route_knowledge',
  'long_night_command','elite_chain','long_night_reality','rift_control',
]);

function campaignId(value:unknown):MainCampaignId|null{
  return typeof value==='string'&&mainCampaignSet.has(value)?value as MainCampaignId:null;
}

function completedCampaignId(value:unknown):CampaignId|null{
  return typeof value==='string'&&campaignSet.has(value)?value as CampaignId:null;
}

function canonicalYear(value:unknown):number|null{
  return typeof value==='number'&&Number.isInteger(value)&&Number.isFinite(value)&&value>=1?value:null;
}

function validWeek(value:unknown):boolean{
  return typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=4;
}

function uniqueWinterFacts(raw:unknown):WinterCampaignActionFact[]{
  if(!Array.isArray(raw))return [];
  return [...new Set(raw.filter((value):value is WinterCampaignActionFact=>typeof value==='string'&&winterFactSet.has(value)))];
}

const winterObjectives={
  caretaker:[
    {id:'winter_caretaker_protection',facts:['long_night_protection']},
    {id:'winter_caretaker_shared_burden',facts:['responsibility_sharing']},
  ],
  pathfinder:[
    {id:'winter_pathfinder_route',facts:['long_night_route']},
    {id:'winter_pathfinder_route_memory',facts:['route_knowledge']},
  ],
  vanguard:[
    {id:'winter_vanguard_command',facts:['long_night_command']},
    {id:'winter_vanguard_elite_chain',facts:['elite_chain']},
  ],
  arcanist:[
    {id:'winter_arcanist_reality',facts:['long_night_reality']},
    {id:'winter_arcanist_control',facts:['rift_control']},
  ],
} as const;

export type WinterCampaignObjectiveId=typeof winterObjectives[MainCampaignId][number]['id'];

export function resolveWinterCampaignAction(input:{
  year:unknown;
  week:unknown;
  campaign:unknown;
  facts:unknown;
  claimedKeys:unknown;
}){
  const year=canonicalYear(input.year);
  const campaign=campaignId(input.campaign);
  if(!year||!campaign||!validWeek(input.week))return {accepted:false as const,reason:'invalid_context' as const};
  const facts=uniqueWinterFacts(input.facts);
  const objective=winterObjectives[campaign].find(candidate=>candidate.facts.some(fact=>facts.includes(fact as WinterCampaignActionFact)));
  if(!objective)return {accepted:false as const,reason:'no_match' as const};
  const claimKey=`${year}-winter:${campaign}:${objective.id}` as const;
  const claimed=sanitizeCampaignSeasonalObjectiveClaimKeys(input.claimedKeys);
  if(claimed.includes(claimKey))return {accepted:false as const,reason:'already_claimed' as const,objective,claimKey};
  return {
    accepted:true as const,
    objective,
    claimKey,
    reward:{kind:'campaign_memory' as const,memoryId:`${objective.id}_memory` as const},
  };
}

export type AcceptedLongNightOutcome={
  accepted:true;
  campaignId:MainCampaignId;
  outcome:MajorOutcomeResult;
};

export function resolveLongNightOutcome(input:{campaign:unknown;outcome:unknown}):
  | AcceptedLongNightOutcome
  | {accepted:false;reason:'invalid_outcome'}{
  const campaign=campaignId(input.campaign);
  if(!campaign||typeof input.outcome!=='string'||!(majorOutcomeResults as readonly string[]).includes(input.outcome)){
    return {accepted:false,reason:'invalid_outcome'};
  }
  return {accepted:true,campaignId:campaign,outcome:input.outcome as MajorOutcomeResult};
}

export function commitLongNightOutcome(state:CampaignRunState,result:AcceptedLongNightOutcome):
  | {committed:true;state:CampaignRunState}
  | {committed:false;state:CampaignRunState;reason:'not_ready'|'campaign_conflict'|'already_committed'}{
  const activeCampaign=campaignId(state.activeCampaign);
  if(!activeCampaign||!state.seasonMilestones.includes('autumn_resolved')){
    return {committed:false,state,reason:'not_ready'};
  }
  if(activeCampaign!==result.campaignId){
    return {committed:false,state,reason:'campaign_conflict'};
  }
  if(state.majorOutcomes.long_night!==undefined||state.seasonMilestones.includes('winter_resolved')){
    return {committed:false,state,reason:'already_committed'};
  }
  const failForwardOutcomes=result.outcome==='defeat'&&!state.failForwardOutcomes.includes('long_night')
    ? [...state.failForwardOutcomes,'long_night' as const]
    : state.failForwardOutcomes;
  return {
    committed:true,
    state:{
      ...state,
      phase:'ending',
      majorOutcomes:{...state.majorOutcomes,long_night:result.outcome},
      failForwardOutcomes,
      seasonMilestones:[...state.seasonMilestones,'winter_resolved'],
    },
  };
}

export type ModularEndingDimensions={
  campaign:string;
  bond:string;
  world:string;
  career:string;
};

export type ModularEnding={
  id:string;
  dimensions:ModularEndingDimensions;
};

const semanticDimensionPattern=/^[a-z][a-z0-9_]{0,63}$/;

function semanticDimension(value:unknown):string|null{
  return typeof value==='string'&&semanticDimensionPattern.test(value)?value:null;
}

export function resolveModularEnding(input:{
  campaignResolution:unknown;
  bondResolution:unknown;
  worldResolution:unknown;
  careerResolution:unknown;
}):
  | {accepted:true;ending:ModularEnding}
  | {accepted:false;reason:'invalid_dimension'}{
  const campaign=semanticDimension(input.campaignResolution);
  const bond=semanticDimension(input.bondResolution);
  const world=semanticDimension(input.worldResolution);
  const career=semanticDimension(input.careerResolution);
  if(!campaign||!bond||!world||!career)return {accepted:false,reason:'invalid_dimension'};
  const dimensions={campaign,bond,world,career};
  return {
    accepted:true,
    ending:{id:`v3:${campaign}:${bond}:${world}:${career}`,dimensions},
  };
}

function parseModularEndingId(value:unknown):ModularEndingDimensions|null{
  if(typeof value!=='string')return null;
  const parts=value.split(':');
  if(parts.length!==5||parts[0]!=='v3')return null;
  const campaign=semanticDimension(parts[1]);
  const bond=semanticDimension(parts[2]);
  const world=semanticDimension(parts[3]);
  const career=semanticDimension(parts[4]);
  return campaign&&bond&&world&&career?{campaign,bond,world,career}:null;
}

function sameDimensions(a:ModularEndingDimensions,b:ModularEndingDimensions):boolean{
  return a.campaign===b.campaign&&a.bond===b.bond&&a.world===b.world&&a.career===b.career;
}

export type WinterEndingSummaryInput={
  majorWorldOutcomes?:unknown;
  keyBondMemories?:unknown;
  trueClues?:unknown;
  truePathEvidence?:TruePathEvidenceId[];
};

export function commitWinterEnding(state:V3PersistentState,ending:ModularEnding,summary:WinterEndingSummaryInput={}):
  | {committed:true;state:V3PersistentState}
  | {committed:false;state:V3PersistentState;reason:'not_ready'|'already_committed'|'invalid_ending'}{
  const campaign=campaignId(state.campaignRun.activeCampaign);
  if(!campaign||!state.campaignRun.seasonMilestones.includes('winter_resolved')||state.campaignRun.majorOutcomes.long_night===undefined){
    return {committed:false,state,reason:'not_ready'};
  }
  if(state.campaignRun.seasonMilestones.includes('ending_committed')||state.legacy.runSummaries.some(item=>item.runNumber===state.campaignRun.runNumber)){
    return {committed:false,state,reason:'already_committed'};
  }
  const parsed=parseModularEndingId(ending.id);
  if(!parsed||!sameDimensions(parsed,ending.dimensions)){
    return {committed:false,state,reason:'invalid_ending'};
  }
  const runSummary={
    runNumber:state.campaignRun.runNumber,
    campaign,
    route:state.campaignRun.activeRoute,
    ending:ending.id,
    career:ending.dimensions.career,
    majorWorldOutcomes:summary.majorWorldOutcomes??[],
    keyBondMemories:summary.keyBondMemories??[],
    trueClues:summary.trueClues??[],
    ...(summary.truePathEvidence?.length?{truePathEvidence:summary.truePathEvidence}:{}),
  };
  const legacy=hydrateLegacyState({
    ...state.legacy,
    completedRuns:state.legacy.completedRuns+1,
    completedCampaigns:[...state.legacy.completedCampaigns,campaign],
    endingCollection:[...state.legacy.endingCollection,ending.id],
    careerCollection:[...state.legacy.careerCollection,ending.dimensions.career],
    runSummaries:[...state.legacy.runSummaries,runSummary],
  });
  return {
    committed:true,
    state:{
      ...state,
      campaignRun:{
        ...state.campaignRun,
        phase:'ending',
        seasonMilestones:[...state.campaignRun.seasonMilestones,'ending_committed'],
      },
      legacy,
    },
  };
}

export function selectCompletedRunHandoff(state:V3PersistentState){
  if(!state.campaignRun.seasonMilestones.includes('ending_committed'))return null;
  const campaign=completedCampaignId(state.campaignRun.activeCampaign);
  const longNightOutcome=state.campaignRun.majorOutcomes.long_night;
  if(!campaign||!longNightOutcome)return null;
  const summary=state.legacy.runSummaries.find(item=>item.runNumber===state.campaignRun.runNumber&&item.campaign===campaign);
  if(!summary?.ending||summary.route!==state.campaignRun.activeRoute)return null;
  const dimensions=parseModularEndingId(summary.ending);
  const invalidRouteDimension=summary.route==='hollow'
    ? dimensions?.campaign!=='hollow'
    : campaign==='true_path'&&dimensions?.campaign!=='true_path';
  if(!dimensions||invalidRouteDimension||summary.career!==dimensions.career)return null;
  return {
    runNumber:state.campaignRun.runNumber,
    campaignId:campaign,
    route:state.campaignRun.activeRoute,
    longNightOutcome,
    endingId:summary.ending,
    dimensions,
  };
}
