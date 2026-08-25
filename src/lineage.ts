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

const personalityKeys:LineagePersonalityKey[]=['courage','kindness','curiosity','calmness'];
const guardianRankIds=guardianRankDefinitions.map(item=>item.id);
const lineageRouteIds:LineageRouteId[]=[...campaignIds,'hollow'];

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

function hydrateAncestor(raw:unknown):AncestorRecord|null{
  if(!isV3Record(raw))return null;
  const generation=positiveInt(raw.generation,0);
  if(generation<1)return null;
  const route=typeof raw.route==='string'&&(lineageRouteIds as readonly string[]).includes(raw.route)
    ? raw.route as LineageRouteId
    : null;
  const guardianRank=typeof raw.guardianRank==='string'&&(guardianRankIds as readonly string[]).includes(raw.guardianRank)
    ? raw.guardianRank as GuardianRankId
    : 'trainee';
  const personalityKey=typeof raw.personalityKey==='string'&&(personalityKeys as readonly string[]).includes(raw.personalityKey)
    ? raw.personalityKey as LineagePersonalityKey
    : 'kindness';
  return {
    generation,
    yearsLived:positiveInt(raw.yearsLived),
    route,
    ending:nullableEnding(raw.ending),
    guardianRank,
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
