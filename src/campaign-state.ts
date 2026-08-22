import {
  campaignIds,
  campaignMilestoneIds,
  campaignPhases,
  campaignRoutes,
  dangerBehaviorIds,
  mainCampaignIds,
  majorChoiceOptions,
  majorEventIds,
  majorOutcomeResults,
  type CampaignId,
  type CampaignMilestoneId,
  type CampaignPhase,
  type CampaignRoute,
  type DangerBehaviorId,
  type MainCampaignId,
  type MajorChoiceId,
  type MajorChoiceOptionId,
  type MajorEventId,
  type MajorOutcomeResult,
} from './campaign-model';
import {sanitizeCampaignSeasonalObjectiveClaimKeys} from './campaign-seasonal-objectives';
import {isV3Record,safeNonNegativeInt,safePositiveInt,uniqueRegistered} from './v3-state-sanitize';

export type CampaignRunState={
  runNumber:number;
  phase:CampaignPhase;
  activeCampaign:CampaignId|null;
  activeRoute:CampaignRoute;
  campaignAffinities:Record<MainCampaignId,number>;
  dangerState:{score:number;behaviors:DangerBehaviorId[]};
  seasonMilestones:CampaignMilestoneId[];
  majorChoices:Partial<Record<MajorChoiceId,MajorChoiceOptionId>>;
  majorOutcomes:Partial<Record<MajorEventId,MajorOutcomeResult>>;
  failForwardOutcomes:MajorEventId[];
  claimedCampaignRewards:CampaignMilestoneId[];
  claimedSeasonalObjectives:string[];
};

export function emptyCampaignRunState():CampaignRunState{
  return {
    runNumber:1,
    phase:'spring_exploration',
    activeCampaign:null,
    activeRoute:'normal',
    campaignAffinities:{caretaker:0,pathfinder:0,vanguard:0,arcanist:0},
    dangerState:{score:0,behaviors:[]},
    seasonMilestones:[],
    majorChoices:{},
    majorOutcomes:{},
    failForwardOutcomes:[],
    claimedCampaignRewards:[],
    claimedSeasonalObjectives:[],
  };
}

export function hydrateCampaignRunState(raw:unknown):CampaignRunState{
  const source=isV3Record(raw)?raw:{};
  const affinitySource=isV3Record(source.campaignAffinities)?source.campaignAffinities:{};
  const dangerSource=isV3Record(source.dangerState)?source.dangerState:{};
  const choiceSource=isV3Record(source.majorChoices)?source.majorChoices:{};
  const outcomeSource=isV3Record(source.majorOutcomes)?source.majorOutcomes:{};

  const campaignAffinities=Object.fromEntries(
    mainCampaignIds.map(id=>[id,safeNonNegativeInt(affinitySource[id])]),
  ) as Record<MainCampaignId,number>;

  const majorChoices:Partial<Record<MajorChoiceId,MajorChoiceOptionId>>={};
  for(const id of Object.keys(majorChoiceOptions) as MajorChoiceId[]){
    const value=choiceSource[id];
    if(typeof value==='string'&&(majorChoiceOptions[id] as readonly string[]).includes(value)){
      majorChoices[id]=value as MajorChoiceOptionId;
    }
  }

  const majorOutcomes:Partial<Record<MajorEventId,MajorOutcomeResult>>={};
  for(const id of majorEventIds){
    const value=outcomeSource[id];
    if(typeof value==='string'&&(majorOutcomeResults as readonly string[]).includes(value)){
      majorOutcomes[id]=value as MajorOutcomeResult;
    }
  }

  const phase=typeof source.phase==='string'&&(campaignPhases as readonly string[]).includes(source.phase)
    ? source.phase as CampaignPhase
    : 'spring_exploration';
  const activeCampaign=typeof source.activeCampaign==='string'&&(campaignIds as readonly string[]).includes(source.activeCampaign)
    ? source.activeCampaign as CampaignId
    : null;
  const activeRoute=typeof source.activeRoute==='string'&&(campaignRoutes as readonly string[]).includes(source.activeRoute)
    ? source.activeRoute as CampaignRoute
    : 'normal';

  return {
    runNumber:safePositiveInt(source.runNumber,1),
    phase,
    activeCampaign,
    activeRoute,
    campaignAffinities,
    dangerState:{
      score:safeNonNegativeInt(dangerSource.score),
      behaviors:uniqueRegistered(dangerSource.behaviors,dangerBehaviorIds),
    },
    seasonMilestones:uniqueRegistered(source.seasonMilestones,campaignMilestoneIds),
    majorChoices,
    majorOutcomes,
    failForwardOutcomes:uniqueRegistered(source.failForwardOutcomes,majorEventIds),
    claimedCampaignRewards:uniqueRegistered(source.claimedCampaignRewards,campaignMilestoneIds),
    claimedSeasonalObjectives:sanitizeCampaignSeasonalObjectiveClaimKeys(source.claimedSeasonalObjectives),
  };
}