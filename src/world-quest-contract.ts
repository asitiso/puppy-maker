import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import type {MobileWorldRecommendation} from './mobile-category-guidance';
import {questNpcForCategory} from './world-quest-npcs';

export type WorldQuestContract={id:string;feature:MobileFeatureId;category:MobileContentCategory;title:string;reason:string;acceptedAt:string;issuerId?:string;issuerName?:string;};
export type WorldQuestJournalEntry={title:string;issuerId:string;issuerName:string;category:MobileContentCategory;completedAt:string};
export type WorldQuestHistory={completed:number;lastCompletedAt:string|null;lastTitle:string|null;lastIssuerName:string|null;completedByIssuer:Record<string,number>;recent:WorldQuestJournalEntry[]};

export const WORLD_QUEST_STORAGE_KEY='puppy-maker:v17:world-quest';
export const WORLD_QUEST_HISTORY_KEY='puppy-maker:v17:world-quest-history';
const emptyHistory=():WorldQuestHistory=>({completed:0,lastCompletedAt:null,lastTitle:null,lastIssuerName:null,completedByIssuer:{},recent:[]});

export function questFromRecommendation(recommendation:MobileWorldRecommendation,now=new Date()):WorldQuestContract{
  const npc=questNpcForCategory(recommendation.category);
  return {id:`${recommendation.category}:${recommendation.feature}`,feature:recommendation.feature,category:recommendation.category,title:recommendation.label,reason:recommendation.reason,acceptedAt:now.toISOString(),issuerId:npc.id,issuerName:npc.name};
}
export function isQuestResolved(contract:WorldQuestContract,recommendation:MobileWorldRecommendation){return contract.feature!==recommendation.feature||contract.category!==recommendation.category;}
export function loadWorldQuest(storage:Pick<Storage,'getItem'>|null|undefined):WorldQuestContract|null{
  if(!storage)return null;try{const raw=storage.getItem(WORLD_QUEST_STORAGE_KEY);if(!raw)return null;const value=JSON.parse(raw) as Partial<WorldQuestContract>;if(typeof value.id!=='string'||typeof value.feature!=='string'||typeof value.category!=='string'||typeof value.title!=='string'||typeof value.reason!=='string'||typeof value.acceptedAt!=='string')return null;return value as WorldQuestContract;}catch{return null;}
}
export function saveWorldQuest(storage:Pick<Storage,'setItem'>|null|undefined,contract:WorldQuestContract){storage?.setItem(WORLD_QUEST_STORAGE_KEY,JSON.stringify(contract));}
export function clearWorldQuest(storage:Pick<Storage,'removeItem'>|null|undefined){storage?.removeItem(WORLD_QUEST_STORAGE_KEY);}

export function loadWorldQuestHistory(storage:Pick<Storage,'getItem'>|null|undefined):WorldQuestHistory{
  const empty=emptyHistory();if(!storage)return empty;
  try{const raw=storage.getItem(WORLD_QUEST_HISTORY_KEY);if(!raw)return empty;const value=JSON.parse(raw) as Partial<WorldQuestHistory>;
    const completed=typeof value.completed==='number'&&value.completed>=0?Math.floor(value.completed):0;
    const completedByIssuer=value.completedByIssuer&&typeof value.completedByIssuer==='object'?Object.fromEntries(Object.entries(value.completedByIssuer).filter(([,count])=>typeof count==='number'&&count>=0).map(([id,count])=>[id,Math.floor(count as number)])):{};
    const recent=Array.isArray(value.recent)?value.recent.filter((entry):entry is WorldQuestJournalEntry=>!!entry&&typeof entry.title==='string'&&typeof entry.issuerId==='string'&&typeof entry.issuerName==='string'&&typeof entry.category==='string'&&typeof entry.completedAt==='string').slice(0,10):[];
    return {completed,lastCompletedAt:typeof value.lastCompletedAt==='string'?value.lastCompletedAt:null,lastTitle:typeof value.lastTitle==='string'?value.lastTitle:null,lastIssuerName:typeof value.lastIssuerName==='string'?value.lastIssuerName:null,completedByIssuer,recent};
  }catch{return empty;}
}
export function recordWorldQuestCompletion(storage:(Pick<Storage,'getItem'|'setItem'>)|null|undefined,contract:WorldQuestContract,now=new Date()):WorldQuestHistory{
  const previous=loadWorldQuestHistory(storage);const npc=questNpcForCategory(contract.category);const issuerId=contract.issuerId??npc.id;const issuerName=contract.issuerName??npc.name;const completedAt=now.toISOString();
  const next:WorldQuestHistory={completed:previous.completed+1,lastCompletedAt:completedAt,lastTitle:contract.title,lastIssuerName:issuerName,completedByIssuer:{...previous.completedByIssuer,[issuerId]:(previous.completedByIssuer[issuerId]??0)+1},recent:[{title:contract.title,issuerId,issuerName,category:contract.category,completedAt},...previous.recent].slice(0,10)};
  storage?.setItem(WORLD_QUEST_HISTORY_KEY,JSON.stringify(next));return next;
}
export function npcQuestRank(completed:number){if(completed>=20)return '전설의 동료';if(completed>=10)return '신뢰받는 동료';if(completed>=5)return '단골 모험가';if(completed>=1)return '첫 의뢰 완료';return '첫 만남';}
