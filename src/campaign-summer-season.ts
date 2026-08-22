import {
  mainCampaignIds,
  majorOutcomeResults,
  type MainCampaignId,
  type MajorOutcomeResult,
} from './campaign-model';
import type {CampaignRunState} from './campaign-state';
import {resolveCampaignSeasonalObjective,type CampaignSeasonalSignalKind} from './campaign-seasonal-objectives';

export type SummerCampaignActionFact=
  | 'bond'
  | 'rescue'
  | 'protect'
  | 'recovery'
  | 'discovery'
  | 'uncleared_region'
  | 'limited_exploration'
  | 'strong_opponent'
  | 'ally_survival'
  | 'defeat_recovery'
  | 'relic'
  | 'astral'
  | 'status_combat';

const mainCampaignSet=new Set<string>(mainCampaignIds);
const majorOutcomeSet=new Set<string>(majorOutcomeResults);

function campaignId(value:unknown):MainCampaignId|null{
  return typeof value==='string'&&mainCampaignSet.has(value)?value as MainCampaignId:null;
}

function factsToSignals(campaign:MainCampaignId,raw:unknown):CampaignSeasonalSignalKind[]{
  if(!Array.isArray(raw))return [];
  const facts=[...new Set(raw.filter((value):value is SummerCampaignActionFact=>typeof value==='string'))];
  const signals:CampaignSeasonalSignalKind[]=[];
  for(const fact of facts){
    if(campaign==='caretaker'&&(['bond','rescue','protect','recovery'] as const).includes(fact as any)) signals.push(fact as CampaignSeasonalSignalKind);
    else if(campaign==='pathfinder'&&(['discovery','uncleared_region','limited_exploration'] as const).includes(fact as any)) signals.push(fact as CampaignSeasonalSignalKind);
    else if(campaign==='vanguard'&&fact==='strong_opponent') signals.push('strong_opponent');
    else if(campaign==='vanguard'&&(fact==='ally_survival'||fact==='defeat_recovery')) signals.push('tactical_challenge');
    else if(campaign==='arcanist'&&(['relic','astral','status_combat'] as const).includes(fact as any)) signals.push(fact as CampaignSeasonalSignalKind);
  }
  return [...new Set(signals)];
}

export function resolveSummerCampaignAction(input:{
  year:unknown;
  week:unknown;
  campaign:unknown;
  facts:unknown;
  claimedKeys:unknown;
}){
  const campaign=campaignId(input.campaign);
  if(!campaign)return {accepted:false as const,reason:'invalid_context' as const};
  return resolveCampaignSeasonalObjective({
    year:input.year,
    week:input.week,
    season:'summer',
    campaign,
    signals:factsToSignals(campaign,input.facts),
    claimedKeys:input.claimedKeys,
  });
}

export type SummerCampaignOutcome={
  accepted:true;
  campaignId:MainCampaignId;
  majorEvent:'guardian_festival';
  outcome:MajorOutcomeResult;
  milestone:'summer_resolved';
};

export function resolveSummerCampaignOutcome(input:{campaign:unknown;outcome:unknown}):SummerCampaignOutcome|{accepted:false;reason:'invalid_result'}{
  const campaign=campaignId(input.campaign);
  if(!campaign||typeof input.outcome!=='string'||!majorOutcomeSet.has(input.outcome)){
    return {accepted:false,reason:'invalid_result'};
  }
  return {
    accepted:true,
    campaignId:campaign,
    majorEvent:'guardian_festival',
    outcome:input.outcome as MajorOutcomeResult,
    milestone:'summer_resolved',
  };
}

export function commitSummerCampaignOutcome(state:CampaignRunState,result:SummerCampaignOutcome):CampaignRunState{
  if(state.majorOutcomes.guardian_festival!==undefined)return state;
  return {
    ...state,
    majorOutcomes:{...state.majorOutcomes,guardian_festival:result.outcome},
    seasonMilestones:state.seasonMilestones.includes('summer_resolved')
      ? state.seasonMilestones
      : [...state.seasonMilestones,'summer_resolved'],
  };
}
