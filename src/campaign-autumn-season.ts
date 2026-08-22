import {
  mainCampaignIds,
  majorChoiceOptions,
  type MainCampaignId,
  type MajorChoiceId,
  type MajorChoiceOptionId,
} from './campaign-model';
import type {CampaignRunState} from './campaign-state';
import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-claim-keys';

export type AutumnCampaignActionFact=
  | 'great_expedition_protect'
  | 'great_expedition_discovery'
  | 'great_expedition_command'
  | 'great_expedition_relic'
  | 'bond_support'
  | 'limited_route_evidence'
  | 'ally_support'
  | 'astral_mastery';

export type AutumnEvidenceTag=
  | 'bond_support'
  | 'protected_civilians'
  | 'discovery_evidence'
  | 'limited_route_evidence'
  | 'ally_support'
  | 'independent_command_evidence'
  | 'relic_control_evidence'
  | 'astral_mastery';

const mainCampaignSet=new Set<string>(mainCampaignIds);
const factSet=new Set<string>([
  'great_expedition_protect','great_expedition_discovery','great_expedition_command','great_expedition_relic',
  'bond_support','limited_route_evidence','ally_support','astral_mastery',
]);
const evidenceSet=new Set<string>([
  'bond_support','protected_civilians','discovery_evidence','limited_route_evidence',
  'ally_support','independent_command_evidence','relic_control_evidence','astral_mastery',
]);

function campaignId(value:unknown):MainCampaignId|null{
  return typeof value==='string'&&mainCampaignSet.has(value)?value as MainCampaignId:null;
}

function canonicalYear(value:unknown):number|null{
  return typeof value==='number'&&Number.isInteger(value)&&Number.isFinite(value)&&value>=1?value:null;
}

function validWeek(value:unknown):boolean{
  return typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=4;
}

function uniqueRegistered<T extends string>(raw:unknown,set:Set<string>):T[]{
  if(!Array.isArray(raw))return [];
  return [...new Set(raw.filter((value):value is T=>typeof value==='string'&&set.has(value)))];
}

const autumnObjectives={
  caretaker:[
    {id:'autumn_caretaker_guardianship',facts:['great_expedition_protect']},
    {id:'autumn_caretaker_bond',facts:['bond_support']},
  ],
  pathfinder:[
    {id:'autumn_pathfinder_route',facts:['great_expedition_discovery']},
    {id:'autumn_pathfinder_limited_access',facts:['limited_route_evidence']},
  ],
  vanguard:[
    {id:'autumn_vanguard_command',facts:['great_expedition_command']},
    {id:'autumn_vanguard_coalition',facts:['ally_support']},
  ],
  arcanist:[
    {id:'autumn_arcanist_relic',facts:['great_expedition_relic']},
    {id:'autumn_arcanist_control',facts:['astral_mastery']},
  ],
} as const;

export type AutumnCampaignObjectiveId=typeof autumnObjectives[MainCampaignId][number]['id'];

export function resolveAutumnCampaignAction(input:{
  year:unknown;
  week:unknown;
  campaign:unknown;
  facts:unknown;
  claimedKeys:unknown;
}){
  const year=canonicalYear(input.year);
  const campaign=campaignId(input.campaign);
  if(!year||!campaign||!validWeek(input.week))return {accepted:false as const,reason:'invalid_context' as const};
  const facts=uniqueRegistered<AutumnCampaignActionFact>(input.facts,factSet);
  const objective=autumnObjectives[campaign].find(candidate=>candidate.facts.some(fact=>facts.includes(fact as AutumnCampaignActionFact)));
  if(!objective)return {accepted:false as const,reason:'no_match' as const};
  const claimKey=`${year}-autumn:${campaign}:${objective.id}` as const;
  const claimed=sanitizeCampaignSeasonalObjectiveClaimKeys(input.claimedKeys);
  if(claimed.includes(claimKey))return {accepted:false as const,reason:'already_claimed' as const,objective,claimKey};
  return {
    accepted:true as const,
    objective,
    claimKey,
    reward:{kind:'campaign_memory' as const,memoryId:`${objective.id}_memory` as const},
  };
}

const thirdChoiceContracts={
  caretaker:{choiceId:'team_solution',required:['bond_support','protected_civilians']},
  pathfinder:{choiceId:'limited_access',required:['discovery_evidence','limited_route_evidence']},
  vanguard:{choiceId:'coalition_command',required:['ally_support','independent_command_evidence']},
  arcanist:{choiceId:'controlled_use',required:['relic_control_evidence','astral_mastery']},
} as const;

export function resolveAutumnThirdOptionEligibility(input:{campaign:unknown;evidence:unknown}){
  const campaign=campaignId(input.campaign);
  if(!campaign)return {eligible:false as const,reason:'invalid_campaign' as const};
  const evidence=uniqueRegistered<AutumnEvidenceTag>(input.evidence,evidenceSet);
  const contract=thirdChoiceContracts[campaign];
  return {
    eligible:contract.required.every(tag=>evidence.includes(tag as AutumnEvidenceTag)),
    campaignId:campaign,
    choiceId:contract.choiceId,
  };
}

const majorChoiceIdByCampaign:Record<MainCampaignId,MajorChoiceId>={
  caretaker:'caretaker_autumn',
  pathfinder:'pathfinder_autumn',
  vanguard:'vanguard_autumn',
  arcanist:'arcanist_autumn',
};

export type AcceptedAutumnMajorChoice={
  accepted:true;
  campaignId:MainCampaignId;
  majorChoiceId:MajorChoiceId;
  choiceId:MajorChoiceOptionId;
};

export function resolveAutumnMajorChoice(input:{campaign:unknown;choice:unknown;thirdEligible:unknown}):AcceptedAutumnMajorChoice|{accepted:false;reason:'invalid_choice'|'choice_locked'}{
  const campaign=campaignId(input.campaign);
  if(!campaign||typeof input.choice!=='string')return {accepted:false,reason:'invalid_choice'};
  const majorChoiceId=majorChoiceIdByCampaign[campaign];
  const options=majorChoiceOptions[majorChoiceId] as readonly string[];
  if(!options.includes(input.choice))return {accepted:false,reason:'invalid_choice'};
  if(input.choice===options[2]&&input.thirdEligible!==true)return {accepted:false,reason:'choice_locked'};
  return {accepted:true,campaignId:campaign,majorChoiceId,choiceId:input.choice as MajorChoiceOptionId};
}

export function commitAutumnMajorChoice(state:CampaignRunState,result:AcceptedAutumnMajorChoice):
  | {committed:true;state:CampaignRunState}
  | {committed:false;state:CampaignRunState;reason:'campaign_conflict'|'already_committed'}{
  if(state.activeCampaign!==null&&state.activeCampaign!==result.campaignId){
    return {committed:false,state,reason:'campaign_conflict'};
  }
  if(state.majorChoices[result.majorChoiceId]!==undefined){
    return {committed:false,state,reason:'already_committed'};
  }
  return {
    committed:true,
    state:{
      ...state,
      activeCampaign:state.activeCampaign??result.campaignId,
      majorChoices:{...state.majorChoices,[result.majorChoiceId]:result.choiceId},
      seasonMilestones:state.seasonMilestones.includes('autumn_resolved')
        ? state.seasonMilestones
        : [...state.seasonMilestones,'autumn_resolved'],
    },
  };
}

export function selectWinterCampaignInput(state:CampaignRunState){
  if(!state.seasonMilestones.includes('autumn_resolved'))return null;
  const campaign=campaignId(state.activeCampaign);
  if(!campaign)return null;
  const choice=state.majorChoices[majorChoiceIdByCampaign[campaign]];
  if(!choice)return null;
  return {
    campaignId:campaign,
    autumnChoiceId:choice,
    greatExpeditionOutcome:state.majorOutcomes.great_expedition,
  };
}
