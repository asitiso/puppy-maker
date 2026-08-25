import {campaignIds,type CampaignId} from './campaign-model';
import {guardianRankDefinitions,type GuardianRankId} from './guardian-rank';
import type {Personality} from './game-core';
import {isV3Record} from './v3-state-sanitize';
import {worldFactIds,type WorldFactId} from './world-history';

export const heritageTraitIds=[
  'warm_heart',
  'trail_memory',
  'steadfast_guardian',
  'arcane_echo',
  'true_echo',
  'hollow_echo',
  'world_witness',
] as const;

export type HeritageTraitId=typeof heritageTraitIds[number];
export type LifeStage='growing'|'young_guardian'|'seasoned_guardian';
export type LineageRouteId=CampaignId|'hollow';
export type LineagePersonalityKey=keyof Personality;

export const heritageTraitDefinitions:Record<HeritageTraitId,{label:string;description:string}>={
  warm_heart:{label:'따뜻한 혈통',description:'관계와 배려의 기억이 다음 세대에 남습니다.'},
  trail_memory:{label:'길의 기억',description:'탐험과 호기심의 흔적이 다음 세대를 이끕니다.'},
  steadfast_guardian:{label:'굳센 수호자',description:'용기와 책임의 태도가 가문의 기질로 이어집니다.'},
  arcane_echo:{label:'마력의 메아리',description:'마법과 탐구의 정체성이 이야기 속에 남습니다.'},
  true_echo:{label:'진실의 메아리',description:'True Path의 선택이 다음 세대의 이야기 반응에 흔적을 남깁니다.'},
  hollow_echo:{label:'공허의 메아리',description:'Hollow Path의 대가가 다음 세대의 이야기 반응에 흔적을 남깁니다.'},
  world_witness:{label:'세계의 증인',description:'세계를 바꾼 기록이 다음 세대의 사건과 대화에 반영됩니다.'},
};

export type AncestorRecord={
  generation:number;
  yearsLived:number;
  route:LineageRouteId|null;
  ending:string|null;
  guardianRank:GuardianRankId;
  personalityKey:LineagePersonalityKey;
  majorWorldFacts:WorldFactId[];
  heritageTraits:HeritageTraitId[];
};

export type LineageState={
  generation:number;
  heritageTraits:HeritageTraitId[];
  ancestors:AncestorRecord[];
};

export type HeritageDerivationInput={
  personality:Personality;
  route:LineageRouteId|null;
  worldFacts:readonly unknown[];
};

export type AncestorRecordInput={
  generation:number;
  yearsLived:number;
  route:LineageRouteId|null;
  ending:string|null;
  guardianRank:GuardianRankId;
  personality:Personality;
  worldFacts:readonly unknown[];
};

export type NextGenerationEligibilityInput={
  year:unknown;
  resolvedEnding:unknown;
  campaignCompleted:boolean;
};

const personalityKeys:LineagePersonalityKey[]=['courage','kindness','curiosity','calmness'];
const guardianRankIds=guardianRankDefinitions.map(item=>item.id);
const lineageRouteIds:LineageRouteId[]=[...campaignIds,'hollow'];
const personalityHeritage:Record<LineagePersonalityKey,HeritageTraitId>={
  courage:'steadfast_guardian',
  kindness:'warm_heart',
  curiosity:'trail_memory',
  calmness:'arcane_echo',
};

function positiveInt(value:unknown,fallback=1):number{
  return typeof value==='number'&&Number.isFinite(value)&&value>0?Math.max(1,Math.floor(value)):fallback;
}

function canonicalValues<T extends string>(raw:unknown,registry:readonly T[],limit=Number.POSITIVE_INFINITY):T[]{
  if(!Array.isArray(raw))return [];
  const selected=new Set(raw.filter((value):value is T=>typeof value==='string'&&(registry as readonly string[]).includes(value)));
  return registry.filter(value=>selected.has(value)).slice(0,limit);
}

function nullableEnding(value:unknown):string|null{
  return typeof value==='string'&&value.trim().length>0?value:null;
}

function sanitizeRoute(value:unknown):LineageRouteId|null{
  return typeof value==='string'&&(lineageRouteIds as readonly string[]).includes(value)
    ? value as LineageRouteId
    : null;
}

function sanitizeGuardianRank(value:unknown):GuardianRankId{
  return typeof value==='string'&&(guardianRankIds as readonly string[]).includes(value)
    ? value as GuardianRankId
    : 'trainee';
}

function hydrateAncestor(raw:unknown):AncestorRecord|null{
  if(!isV3Record(raw))return null;
  const generation=positiveInt(raw.generation,0);
  if(generation<1)return null;
  const personalityKey=typeof raw.personalityKey==='string'&&(personalityKeys as readonly string[]).includes(raw.personalityKey)
    ? raw.personalityKey as LineagePersonalityKey
    : 'kindness';
  return {
    generation,
    yearsLived:positiveInt(raw.yearsLived),
    route:sanitizeRoute(raw.route),
    ending:nullableEnding(raw.ending),
    guardianRank:sanitizeGuardianRank(raw.guardianRank),
    personalityKey,
    majorWorldFacts:canonicalValues(raw.majorWorldFacts,worldFactIds),
    heritageTraits:canonicalValues(raw.heritageTraits,heritageTraitIds,2),
  };
}

export function emptyLineageState():LineageState{
  return {generation:1,heritageTraits:[],ancestors:[]};
}

export function hydrateLineageState(raw:unknown):LineageState{
  if(!isV3Record(raw))return emptyLineageState();
  const generation=positiveInt(raw.generation);
  const heritageTraits=canonicalValues(raw.heritageTraits,heritageTraitIds,2);
  const byGeneration=new Map<number,AncestorRecord>();
  if(Array.isArray(raw.ancestors)){
    for(const value of raw.ancestors){
      const ancestor=hydrateAncestor(value);
      if(ancestor&&!byGeneration.has(ancestor.generation))byGeneration.set(ancestor.generation,ancestor);
    }
  }
  const ancestors=[...byGeneration.values()].sort((a,b)=>a.generation-b.generation).slice(-8);
  return {generation,heritageTraits,ancestors};
}

export function dominantPersonalityKey(personality:Personality):LineagePersonalityKey{
  let selected=personalityKeys[0];
  let best=Number.isFinite(personality[selected])?personality[selected]:0;
  for(const key of personalityKeys.slice(1)){
    const value=Number.isFinite(personality[key])?personality[key]:0;
    if(value>best){
      selected=key;
      best=value;
    }
  }
  return selected;
}

export function deriveHeritageTraits(input:HeritageDerivationInput):HeritageTraitId[]{
  const worldFacts=canonicalValues(input.worldFacts,worldFactIds);
  const candidates:HeritageTraitId[]=[personalityHeritage[dominantPersonalityKey(input.personality)]];
  if(input.route==='true_path')candidates.push('true_echo');
  if(input.route==='hollow')candidates.push('hollow_echo');
  if(worldFacts.length>=2)candidates.push('world_witness');
  return canonicalValues(candidates,heritageTraitIds,2);
}

export function buildAncestorRecord(input:AncestorRecordInput):AncestorRecord{
  const route=sanitizeRoute(input.route);
  const majorWorldFacts=canonicalValues(input.worldFacts,worldFactIds);
  return {
    generation:positiveInt(input.generation),
    yearsLived:positiveInt(input.yearsLived),
    route,
    ending:nullableEnding(input.ending),
    guardianRank:sanitizeGuardianRank(input.guardianRank),
    personalityKey:dominantPersonalityKey(input.personality),
    majorWorldFacts,
    heritageTraits:deriveHeritageTraits({personality:input.personality,route,worldFacts:majorWorldFacts}),
  };
}

export function canStartNextGeneration(input:NextGenerationEligibilityInput):boolean{
  const mature=typeof input.year==='number'&&Number.isFinite(input.year)&&Math.floor(input.year)>=3;
  const hasEnding=typeof input.resolvedEnding==='string'&&input.resolvedEnding.trim().length>0;
  return mature&&(hasEnding||input.campaignCompleted===true);
}

export function lifeStageForYear(year:number):LifeStage{
  const safeYear=typeof year==='number'&&Number.isFinite(year)&&year>0?Math.floor(year):1;
  if(safeYear<=1)return 'growing';
  if(safeYear===2)return 'young_guardian';
  return 'seasoned_guardian';
}

export function lifeStageLabel(year:number):string{
  const stage=lifeStageForYear(year);
  if(stage==='growing')return '성장기';
  if(stage==='young_guardian')return '청년 수호자';
  return '숙련 수호자';
}
