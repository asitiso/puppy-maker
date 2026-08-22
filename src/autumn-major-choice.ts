import {
  mainCampaignIds,
  majorChoiceOptions,
  majorOutcomeResults,
  type MainCampaignId,
  type MajorChoiceId,
  type MajorChoiceOptionId,
  type MajorOutcomeResult,
} from './campaign-model';
import type {CharacterBondsState} from './character-bonds';

type AutumnCharacter='mira'|'kael'|'rex'|'selene';
type AutumnDefinition={
  campaign:MainCampaignId;
  choiceId:MajorChoiceId;
  baseOptions:readonly [MajorChoiceOptionId,MajorChoiceOptionId];
  earnedOption:MajorChoiceOptionId;
  character:AutumnCharacter;
  earnedHint:string;
};

export type AutumnChoiceContext={
  thirdEligible:boolean;
  characterBonds:CharacterBondsState;
};

export type AutumnChoiceCommitment={
  campaign:MainCampaignId;
  choiceId:MajorChoiceId;
  optionId:MajorChoiceOptionId;
};

export type AutumnChoiceAftermath={
  campaign:MainCampaignId;
  optionId:MajorChoiceOptionId;
  character:AutumnCharacter;
  outcome:MajorOutcomeResult;
  memoryId:string;
  promiseId:string|null;
  conflictId:string|null;
  storyBeatKey:string;
  winterTensionKey:string;
  relationshipKey:string;
  trustDelta:number;
};

export type AutumnChoiceResolution={
  campaign:MainCampaignId;
  choiceId:MajorChoiceId;
  options:MajorChoiceOptionId[];
  baseOptions:readonly [MajorChoiceOptionId,MajorChoiceOptionId];
  earned:{optionId:MajorChoiceOptionId;available:boolean;hint:string};
};

const definitions:Record<MainCampaignId,AutumnDefinition>={
  caretaker:{
    campaign:'caretaker',choiceId:'caretaker_autumn',baseOptions:['save_one','spread_risk'],earnedOption:'team_solution',
    character:'mira',earnedHint:'함께 짐을 나눠 온 선택들이 새로운 길을 암시합니다.',
  },
  pathfinder:{
    campaign:'pathfinder',choiceId:'pathfinder_autumn',baseOptions:['open_route','seal_route'],earnedOption:'limited_access',
    character:'kael',earnedHint:'경계를 존중해 온 기록이 제3의 접근법을 암시합니다.',
  },
  vanguard:{
    campaign:'vanguard',choiceId:'vanguard_autumn',baseOptions:['centralize','preserve_independence'],earnedOption:'coalition_command',
    character:'rex',earnedHint:'함께 지휘해 온 경험이 다른 명령 체계를 떠올리게 합니다.',
  },
  arcanist:{
    campaign:'arcanist',choiceId:'arcanist_autumn',baseOptions:['use_relic','destroy_relic'],earnedOption:'controlled_use',
    character:'selene',earnedHint:'힘을 억제해 온 선택들이 통제된 방법의 가능성을 남깁니다.',
  },
};

const consequenceByOption:Record<MajorChoiceOptionId,{promiseId:string|null;conflictId:string|null}>={
  save_one:{promiseId:null,conflictId:'mira_autumn_single_rescue_burden'},
  spread_risk:{promiseId:'mira_autumn_shared_risk',conflictId:null},
  team_solution:{promiseId:'mira_autumn_team_solution',conflictId:null},
  open_route:{promiseId:null,conflictId:'kael_autumn_route_overreach'},
  seal_route:{promiseId:'kael_autumn_guarded_boundary',conflictId:null},
  limited_access:{promiseId:'kael_autumn_limited_access',conflictId:null},
  centralize:{promiseId:null,conflictId:'rex_autumn_command_pressure'},
  preserve_independence:{promiseId:'rex_autumn_shared_command',conflictId:null},
  coalition_command:{promiseId:'rex_autumn_coalition_command',conflictId:null},
  use_relic:{promiseId:null,conflictId:'selene_autumn_forbidden_relic_cost'},
  destroy_relic:{promiseId:'selene_autumn_refuse_relic',conflictId:null},
  controlled_use:{promiseId:'selene_autumn_controlled_use',conflictId:null},
};

const isMainCampaign=(value:unknown):value is MainCampaignId=>typeof value==='string'&&(mainCampaignIds as readonly string[]).includes(value);
const isOutcome=(value:unknown):value is MajorOutcomeResult=>typeof value==='string'&&(majorOutcomeResults as readonly string[]).includes(value);

export function autumnChoiceDefinition(campaign:unknown):AutumnDefinition|null{
  return isMainCampaign(campaign)?definitions[campaign]:null;
}

function earnedAvailable(context:AutumnChoiceContext):boolean{
  return context?.thirdEligible===true;
}

export function resolveAutumnChoiceOptions(campaign:unknown,context:AutumnChoiceContext):AutumnChoiceResolution{
  const definition=autumnChoiceDefinition(campaign);
  if(!definition) throw new Error('invalid_campaign');
  const available=earnedAvailable(context);
  return {
    campaign:definition.campaign,
    choiceId:definition.choiceId,
    options:[...definition.baseOptions,...(available?[definition.earnedOption]:[])],
    baseOptions:definition.baseOptions,
    earned:{optionId:definition.earnedOption,available,hint:definition.earnedHint},
  };
}

function makeAftermath(definition:AutumnDefinition,optionId:MajorChoiceOptionId,outcome:MajorOutcomeResult):AutumnChoiceAftermath{
  const consequence=consequenceByOption[optionId];
  return {
    campaign:definition.campaign,
    optionId,
    character:definition.character,
    outcome,
    memoryId:`${definition.character}_autumn_${optionId}`,
    promiseId:consequence.promiseId,
    conflictId:consequence.conflictId,
    storyBeatKey:`autumn.${definition.campaign}.${optionId}.${outcome}`,
    winterTensionKey:`autumn.${definition.campaign}.${optionId}.winter_tension`,
    relationshipKey:`autumn.${definition.campaign}.${optionId}.relationship`,
    trustDelta:outcome==='defeat'?1:2,
  };
}

export function commitAutumnMajorChoice(
  campaign:unknown,
  optionId:unknown,
  context:AutumnChoiceContext,
  existing:AutumnChoiceCommitment|null,
  outcome:MajorOutcomeResult='victory',
):{status:'invalid_campaign'|'invalid_option'|'not_available'|'committed'|'already_committed'|'locked';commitment:AutumnChoiceCommitment|null;aftermath:AutumnChoiceAftermath|null}{
  const definition=autumnChoiceDefinition(campaign);
  if(!definition)return {status:'invalid_campaign',commitment:existing,aftermath:null};
  const registered=majorChoiceOptions[definition.choiceId] as readonly string[];
  if(typeof optionId!=='string'||!registered.includes(optionId))return {status:'invalid_option',commitment:existing,aftermath:null};
  const typedOption=optionId as MajorChoiceOptionId;
  if(existing){
    if(existing.campaign===definition.campaign&&existing.choiceId===definition.choiceId&&existing.optionId===typedOption){
      return {status:'already_committed',commitment:existing,aftermath:null};
    }
    return {status:'locked',commitment:existing,aftermath:null};
  }
  const resolution=resolveAutumnChoiceOptions(definition.campaign,context);
  if(!resolution.options.includes(typedOption))return {status:'not_available',commitment:null,aftermath:null};
  const safeOutcome=isOutcome(outcome)?outcome:'victory';
  const commitment:AutumnChoiceCommitment={campaign:definition.campaign,choiceId:definition.choiceId,optionId:typedOption};
  return {status:'committed',commitment,aftermath:makeAftermath(definition,typedOption,safeOutcome)};
}

export function applyAutumnChoiceBondConsequence(
  bonds:CharacterBondsState,
  aftermath:AutumnChoiceAftermath|null|undefined,
):{bonds:CharacterBondsState;applied:boolean}{
  if(!aftermath)return {bonds,applied:false};
  const current=bonds[aftermath.character];
  if(current.memories.includes(aftermath.memoryId))return {bonds,applied:false};
  const updated={
    ...current,
    trust:Math.max(0,Math.trunc(current.trust+aftermath.trustDelta)),
    memories:[...current.memories,aftermath.memoryId],
    promises:aftermath.promiseId&&!current.promises.includes(aftermath.promiseId)?[...current.promises,aftermath.promiseId]:current.promises,
    conflicts:aftermath.conflictId&&!current.conflicts.includes(aftermath.conflictId)?[...current.conflicts,aftermath.conflictId]:current.conflicts,
  };
  return {bonds:{...bonds,[aftermath.character]:updated},applied:true};
}

export function autumnChoicePresentation(resolution:AutumnChoiceResolution){
  const definition=definitions[resolution.campaign];
  const ordered=[...definition.baseOptions,definition.earnedOption];
  return {
    campaign:definition.campaign,
    choiceId:definition.choiceId,
    titleKey:`autumn.${definition.campaign}.major_choice`,
    options:ordered.map(optionId=>({
      id:optionId,
      labelKey:`autumn.${definition.campaign}.choice.${optionId}`,
      available:optionId!==definition.earnedOption||resolution.earned.available,
      hint:optionId===definition.earnedOption?resolution.earned.hint:'',
    })),
  };
}
