import type {CareerRecords,CareerTitleId} from './career-records';
import type {CharacterBondsState,CharacterBondState} from './character-bonds';
import {
  mainCampaignIds,
  majorOutcomeResults,
  type MainCampaignId,
  type MajorChoiceOptionId,
  type MajorOutcomeResult,
} from './campaign-model';

export type WinterRepresentative='mira'|'kael'|'rex'|'selene';
export type WinterEndingDimensionId='campaign'|'bond'|'world'|'career';

export type WinterEndingStoryInput={
  campaign:MainCampaignId;
  autumnChoice:MajorChoiceOptionId;
  longNightOutcome:MajorOutcomeResult;
  characterBonds:CharacterBondsState;
  careerRecords:CareerRecords;
  careerTitles:CareerTitleId[];
};

export type WinterCampaignDefinition={
  campaign:MainCampaignId;
  representative:WinterRepresentative;
  storyKey:string;
  validAutumnChoices:readonly MajorChoiceOptionId[];
};

export type WinterBondAftermath={
  character:WinterRepresentative;
  memoryId:string;
  promiseId:string|null;
  conflictId:string|null;
};

export type WinterEndingStoryResult={
  status:'resolved'|'invalid_input';
  campaignResolution:{campaign:MainCampaignId;outcome:MajorOutcomeResult;key:string;summaryKey:string};
  bondResolution:{character:WinterRepresentative;key:string;summaryKey:string};
  worldResolution:{outcome:MajorOutcomeResult;key:string;summaryKey:string};
  careerResolution:{key:string;label:string;summaryKey:string};
  epilogueKey:string;
  bondAftermath:WinterBondAftermath|null;
};

const definitions:Record<MainCampaignId,WinterCampaignDefinition>={
  caretaker:{
    campaign:'caretaker',representative:'mira',storyKey:'winter.caretaker.long_night',
    validAutumnChoices:['save_one','spread_risk','team_solution'],
  },
  pathfinder:{
    campaign:'pathfinder',representative:'kael',storyKey:'winter.pathfinder.long_night',
    validAutumnChoices:['open_route','seal_route','limited_access'],
  },
  vanguard:{
    campaign:'vanguard',representative:'rex',storyKey:'winter.vanguard.long_night',
    validAutumnChoices:['centralize','preserve_independence','coalition_command'],
  },
  arcanist:{
    campaign:'arcanist',representative:'selene',storyKey:'winter.arcanist.long_night',
    validAutumnChoices:['use_relic','destroy_relic','controlled_use'],
  },
};

const isCampaign=(value:unknown):value is MainCampaignId=>typeof value==='string'&&(mainCampaignIds as readonly string[]).includes(value);
const safeOutcome=(value:unknown):MajorOutcomeResult=>
  typeof value==='string'&&(majorOutcomeResults as readonly string[]).includes(value)
    ? value as MajorOutcomeResult
    : 'costly_victory';

export function winterCampaignDefinition(campaign:unknown):WinterCampaignDefinition|null{
  return isCampaign(campaign)?definitions[campaign]:null;
}

function resolveBond(character:WinterRepresentative,bond:CharacterBondState,autumnChoice:MajorChoiceOptionId){
  const matchingAutumn=String(autumnChoice);
  const hasChoiceMemory=bond.memories.some(id=>id.includes(matchingAutumn));
  const hasChoicePromise=bond.promises.some(id=>id.includes(matchingAutumn)||id.includes('shared')||id.includes('together')||id.includes('restrain'));
  const hasConflict=bond.conflicts.length>0;
  const key=hasConflict?'strained':hasChoiceMemory||hasChoicePromise?'fulfilled':'open';
  return {
    character,
    key:`winter.bond.${character}.${key}`,
    summaryKey:`winter.bond.${character}.${key}.summary`,
  };
}

function resolveCareer(records:CareerRecords,titles:CareerTitleId[]){
  const broadExperience=[records.trainings,records.outings,records.gifts,records.monthsCompleted].filter(value=>Number.isFinite(value)&&value>0).length;
  const rank=titles.length>=4&&broadExperience>=3?'legacy':titles.length>=1&&broadExperience>=2?'seasoned':'emerging';
  const label=rank==='legacy'?'완성된 수호자의 길':rank==='seasoned'?'쌓여 온 수호자의 길':'이제 시작되는 수호자의 길';
  return {key:`winter.career.${rank}`,label,summaryKey:`winter.career.${rank}.summary`};
}

function invalidResult(campaign:MainCampaignId,definition:WinterCampaignDefinition,outcome:MajorOutcomeResult):WinterEndingStoryResult{
  return {
    status:'invalid_input',
    campaignResolution:{campaign,outcome,key:'winter.invalid',summaryKey:'winter.invalid.summary'},
    bondResolution:{character:definition.representative,key:'winter.invalid',summaryKey:'winter.invalid.summary'},
    worldResolution:{outcome,key:'winter.invalid',summaryKey:'winter.invalid.summary'},
    careerResolution:{key:'winter.invalid',label:'기록 확인 필요',summaryKey:'winter.invalid.summary'},
    epilogueKey:'winter.invalid',
    bondAftermath:null,
  };
}

export function resolveWinterEndingStory(input:WinterEndingStoryInput):WinterEndingStoryResult{
  const definition=winterCampaignDefinition(input?.campaign);
  const campaign=isCampaign(input?.campaign)?input.campaign:'caretaker';
  const outcome=safeOutcome(input?.longNightOutcome);
  if(!definition)return invalidResult(campaign,definitions[campaign],outcome);
  if(!definition.validAutumnChoices.includes(input.autumnChoice))return invalidResult(campaign,definition,outcome);

  const representativeBond=input.characterBonds?.[definition.representative] ?? {trust:0,conflicts:[],promises:[],memories:[]};
  const bondResolution=resolveBond(definition.representative,representativeBond,input.autumnChoice);
  const careerResolution=resolveCareer(input.careerRecords,input.careerTitles ?? []);
  const campaignKey=`winter.campaign.${campaign}.${input.autumnChoice}.${outcome}`;
  const worldKey=`winter.world.${campaign}.${input.autumnChoice}.${outcome}`;
  const aftermathState=bondResolution.key.endsWith('.strained')?'strained':bondResolution.key.endsWith('.fulfilled')?'fulfilled':'open';
  const bondAftermath:WinterBondAftermath={
    character:definition.representative,
    memoryId:`${definition.representative}_winter_${outcome}`,
    promiseId:aftermathState==='fulfilled'?`${definition.representative}_winter_shared_future`:null,
    conflictId:aftermathState==='strained'?`${definition.representative}_winter_unresolved_tension`:null,
  };
  return {
    status:'resolved',
    campaignResolution:{campaign,outcome,key:campaignKey,summaryKey:`${campaignKey}.summary`},
    bondResolution,
    worldResolution:{outcome,key:worldKey,summaryKey:`${worldKey}.summary`},
    careerResolution,
    epilogueKey:`winter.${campaign}.${input.autumnChoice}.${outcome}.epilogue`,
    bondAftermath,
  };
}

export function applyWinterBondResolution(
  bonds:CharacterBondsState,
  aftermath:WinterBondAftermath|null|undefined,
):{bonds:CharacterBondsState;applied:boolean}{
  if(!aftermath)return {bonds,applied:false};
  const current=bonds[aftermath.character];
  if(!current||current.memories.includes(aftermath.memoryId))return {bonds,applied:false};
  const updated:CharacterBondState={
    ...current,
    memories:[...current.memories,aftermath.memoryId],
    promises:aftermath.promiseId&&!current.promises.includes(aftermath.promiseId)?[...current.promises,aftermath.promiseId]:current.promises,
    conflicts:aftermath.conflictId&&!current.conflicts.includes(aftermath.conflictId)?[...current.conflicts,aftermath.conflictId]:current.conflicts,
  };
  return {bonds:{...bonds,[aftermath.character]:updated},applied:true};
}

export function winterEndingPresentation(result:WinterEndingStoryResult){
  const dimensions=[
    {id:'campaign' as const,label:'캠페인 결말',summaryKey:result.campaignResolution.summaryKey},
    {id:'bond' as const,label:'인연의 결말',summaryKey:result.bondResolution.summaryKey},
    {id:'world' as const,label:'세계의 결말',summaryKey:result.worldResolution.summaryKey},
    {id:'career' as const,label:'성장의 결말',summaryKey:result.careerResolution.summaryKey},
  ];
  return {status:result.status,dimensions,epilogueKey:result.epilogueKey};
}
