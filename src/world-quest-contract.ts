import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import type {MobileWorldRecommendation} from './mobile-category-guidance';
import {questNpcForCategory} from './world-quest-npcs';

export type WorldQuestContract={
  id:string;
  feature:MobileFeatureId;
  category:MobileContentCategory;
  title:string;
  reason:string;
  acceptedAt:string;
  issuerId?:string;
  issuerName?:string;
};

export type WorldQuestHistory={completed:number;lastCompletedAt:string|null;lastTitle:string|null;lastIssuerName:string|null};

export const WORLD_QUEST_STORAGE_KEY='puppy-maker:v17:world-quest';
export const WORLD_QUEST_HISTORY_KEY='puppy-maker:v17:world-quest-history';

export function questFromRecommendation(recommendation:MobileWorldRecommendation,now=new Date()):WorldQuestContract{
  const npc=questNpcForCategory(recommendation.category);
  return {
    id:`${recommendation.category}:${recommendation.feature}`,
    feature:recommendation.feature,
    category:recommendation.category,
    title:recommendation.label,
    reason:recommendation.reason,
    acceptedAt:now.toISOString(),
    issuerId:npc.id,
    issuerName:npc.name,
  };
}

export function isQuestResolved(contract:WorldQuestContract,recommendation:MobileWorldRecommendation){
  return contract.feature!==recommendation.feature||contract.category!==recommendation.category;
}

export function loadWorldQuest(storage:Pick<Storage,'getItem'>|null|undefined):WorldQuestContract|null{
  if(!storage)return null;
  try{
    const raw=storage.getItem(WORLD_QUEST_STORAGE_KEY);
    if(!raw)return null;
    const value=JSON.parse(raw) as Partial<WorldQuestContract>;
    if(typeof value.id!=='string'||typeof value.feature!=='string'||typeof value.category!=='string'||typeof value.title!=='string'||typeof value.reason!=='string'||typeof value.acceptedAt!=='string')return null;
    return value as WorldQuestContract;
  }catch{return null;}
}

export function saveWorldQuest(storage:Pick<Storage,'setItem'>|null|undefined,contract:WorldQuestContract){storage?.setItem(WORLD_QUEST_STORAGE_KEY,JSON.stringify(contract));}
export function clearWorldQuest(storage:Pick<Storage,'removeItem'>|null|undefined){storage?.removeItem(WORLD_QUEST_STORAGE_KEY);}

export function loadWorldQuestHistory(storage:Pick<Storage,'getItem'>|null|undefined):WorldQuestHistory{
  const empty:WorldQuestHistory={completed:0,lastCompletedAt:null,lastTitle:null,lastIssuerName:null};
  if(!storage)return empty;
  try{
    const raw=storage.getItem(WORLD_QUEST_HISTORY_KEY);if(!raw)return empty;
    const value=JSON.parse(raw) as Partial<WorldQuestHistory>;
    return {completed:typeof value.completed==='number'&&value.completed>=0?Math.floor(value.completed):0,lastCompletedAt:typeof value.lastCompletedAt==='string'?value.lastCompletedAt:null,lastTitle:typeof value.lastTitle==='string'?value.lastTitle:null,lastIssuerName:typeof value.lastIssuerName==='string'?value.lastIssuerName:null};
  }catch{return empty;}
}

export function recordWorldQuestCompletion(storage:(Pick<Storage,'getItem'|'setItem'>)|null|undefined,contract:WorldQuestContract,now=new Date()):WorldQuestHistory{
  const previous=loadWorldQuestHistory(storage);
  const next:WorldQuestHistory={completed:previous.completed+1,lastCompletedAt:now.toISOString(),lastTitle:contract.title,lastIssuerName:contract.issuerName??questNpcForCategory(contract.category).name};
  storage?.setItem(WORLD_QUEST_HISTORY_KEY,JSON.stringify(next));
  return next;
}
