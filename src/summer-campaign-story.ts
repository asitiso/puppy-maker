import {
  mainCampaignIds,
  majorOutcomeResults,
  type CharacterId,
  type MainCampaignId,
  type MajorOutcomeResult,
} from './campaign-model';
import type {CharacterBondsState} from './character-bonds';

export type SummerCampaignStoryDefinition={
  campaign:MainCampaignId;
  character:'mira'|'kael'|'rex'|'selene';
  chapterId:`summer_${MainCampaignId}_guardian_festival`;
  titleKey:`summer.${MainCampaignId}.title`;
  objectiveKey:`summer.${MainCampaignId}.objective`;
  framingKey:`summer.${MainCampaignId}.festival_framing`;
  openingBeatKey:`summer.${MainCampaignId}.opening`;
};

export type SummerCampaignStoryResult={
  resolved:boolean;
  campaign:MainCampaignId|null;
  character:CharacterId|null;
  chapterId:string|null;
  titleKey:string|null;
  objectiveKey:string|null;
  framingKey:string|null;
  outcome:MajorOutcomeResult|null;
  outcomeKey:string|null;
  storyBeatKey:string;
  relationshipChange:string;
  nextActionKey:string;
  memoryId:string;
  promiseId:string|null;
  conflictId:string|null;
  bondDelta:number;
};

export type SummerCampaignStoryPresentation={
  campaign:MainCampaignId|null;
  chapterId:string|null;
  titleKey:string|null;
  objectiveKey:string|null;
  framingKey:string|null;
  character:CharacterId|null;
  status:'unresolved'|'resolved';
  outcomeKey:string|null;
  storyBeats:string[];
  relationshipChange:string;
  memories:string[];
  promises:string[];
  conflicts:string[];
  nextActionKey:string;
};

const storyDefinitions:Record<MainCampaignId,SummerCampaignStoryDefinition>={
  caretaker:{
    campaign:'caretaker',character:'mira',chapterId:'summer_caretaker_guardian_festival',
    titleKey:'summer.caretaker.title',objectiveKey:'summer.caretaker.objective',
    framingKey:'summer.caretaker.festival_framing',openingBeatKey:'summer.caretaker.opening',
  },
  pathfinder:{
    campaign:'pathfinder',character:'kael',chapterId:'summer_pathfinder_guardian_festival',
    titleKey:'summer.pathfinder.title',objectiveKey:'summer.pathfinder.objective',
    framingKey:'summer.pathfinder.festival_framing',openingBeatKey:'summer.pathfinder.opening',
  },
  vanguard:{
    campaign:'vanguard',character:'rex',chapterId:'summer_vanguard_guardian_festival',
    titleKey:'summer.vanguard.title',objectiveKey:'summer.vanguard.objective',
    framingKey:'summer.vanguard.festival_framing',openingBeatKey:'summer.vanguard.opening',
  },
  arcanist:{
    campaign:'arcanist',character:'selene',chapterId:'summer_arcanist_guardian_festival',
    titleKey:'summer.arcanist.title',objectiveKey:'summer.arcanist.objective',
    framingKey:'summer.arcanist.festival_framing',openingBeatKey:'summer.arcanist.opening',
  },
};

const isMainCampaignId=(value:unknown):value is MainCampaignId=>
  typeof value==='string'&&mainCampaignIds.includes(value as MainCampaignId);
const isMajorOutcome=(value:unknown):value is MajorOutcomeResult=>
  typeof value==='string'&&majorOutcomeResults.includes(value as MajorOutcomeResult);

export function summerCampaignStoryDefinition(campaign:unknown):SummerCampaignStoryDefinition|null{
  return isMainCampaignId(campaign)?storyDefinitions[campaign]:null;
}

const consequenceIds:Record<MainCampaignId,{
  promise:string;
  conflict:string;
}>={
  caretaker:{promise:'mira_summer_share_responsibility',conflict:'mira_summer_overextended_rescue'},
  pathfinder:{promise:'kael_summer_respect_boundaries',conflict:'kael_summer_crossed_boundary'},
  vanguard:{promise:'rex_summer_lead_together',conflict:'rex_summer_victory_at_cost'},
  arcanist:{promise:'selene_summer_restrain_power',conflict:'selene_summer_forbidden_overreach'},
};

const bondDeltaFor=(outcome:MajorOutcomeResult):number=>
  outcome==='exceptional_victory'?4:outcome==='victory'?3:outcome==='costly_victory'?2:1;

export function resolveSummerCampaignStory(activeCampaign:unknown,outcome:unknown):SummerCampaignStoryResult{
  const definition=summerCampaignStoryDefinition(activeCampaign);
  if(!definition){
    return {resolved:false,campaign:null,character:null,chapterId:null,titleKey:null,objectiveKey:null,framingKey:null,outcome:null,outcomeKey:null,storyBeatKey:'',relationshipChange:'',nextActionKey:'',memoryId:'',promiseId:null,conflictId:null,bondDelta:0};
  }
  if(!isMajorOutcome(outcome)){
    return {resolved:false,campaign:definition.campaign,character:definition.character,chapterId:definition.chapterId,titleKey:definition.titleKey,objectiveKey:definition.objectiveKey,framingKey:definition.framingKey,outcome:null,outcomeKey:null,storyBeatKey:definition.openingBeatKey,relationshipChange:`summer.${definition.campaign}.relationship.pending`,nextActionKey:`summer.${definition.campaign}.next.festival`,memoryId:'',promiseId:null,conflictId:null,bondDelta:0};
  }

  const ids=consequenceIds[definition.campaign];
  const mixed=outcome==='costly_victory'||outcome==='defeat';
  return {
    resolved:true,
    campaign:definition.campaign,
    character:definition.character,
    chapterId:definition.chapterId,
    titleKey:definition.titleKey,
    objectiveKey:definition.objectiveKey,
    framingKey:definition.framingKey,
    outcome,
    outcomeKey:`summer.${definition.campaign}.outcome.${outcome}`,
    storyBeatKey:`summer.${definition.campaign}.beat.${outcome}`,
    relationshipChange:`summer.${definition.campaign}.relationship.${outcome}`,
    nextActionKey:`summer.${definition.campaign}.next.after_festival`,
    memoryId:`${definition.character}_summer_festival_${outcome}`,
    promiseId:mixed?null:ids.promise,
    conflictId:mixed?ids.conflict:null,
    bondDelta:bondDeltaFor(outcome),
  };
}

const appendUnique=(values:string[],value:string|null):string[]=>
  value&&!values.includes(value)?[...values,value]:values;

export function applySummerStoryBondConsequence(
  bonds:CharacterBondsState,result:SummerCampaignStoryResult,
):{bonds:CharacterBondsState;applied:boolean}{
  if(!result.resolved||result.character===null||result.memoryId==='')return {bonds,applied:false};
  const current=bonds[result.character];
  if(current.memories.includes(result.memoryId))return {bonds,applied:false};
  return {
    applied:true,
    bonds:{
      ...bonds,
      [result.character]:{
        ...current,
        trust:current.trust+result.bondDelta,
        memories:appendUnique(current.memories,result.memoryId),
        promises:appendUnique(current.promises,result.promiseId),
        conflicts:appendUnique(current.conflicts,result.conflictId),
      },
    },
  };
}

export function summerCampaignStoryPresentation(
  activeCampaign:unknown,outcome:unknown,bonds:CharacterBondsState,
):SummerCampaignStoryPresentation{
  const result=resolveSummerCampaignStory(activeCampaign,outcome);
  const characterBond=result.character===null?null:bonds[result.character];
  return {
    campaign:result.campaign,
    chapterId:result.chapterId,
    titleKey:result.titleKey,
    objectiveKey:result.objectiveKey,
    framingKey:result.framingKey,
    character:result.character,
    status:result.resolved?'resolved':'unresolved',
    outcomeKey:result.outcomeKey,
    storyBeats:[result.storyBeatKey].filter(Boolean),
    relationshipChange:result.relationshipChange,
    memories:characterBond?.memories??[],
    promises:characterBond?.promises??[],
    conflicts:characterBond?.conflicts??[],
    nextActionKey:result.nextActionKey,
  };
}
