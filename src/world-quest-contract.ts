import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import type {MobileWorldRecommendation} from './mobile-category-guidance';

export type WorldQuestContract={
  id:string;
  feature:MobileFeatureId;
  category:MobileContentCategory;
  title:string;
  reason:string;
  acceptedAt:string;
};

export const WORLD_QUEST_STORAGE_KEY='puppy-maker:v17:world-quest';

export function questFromRecommendation(recommendation:MobileWorldRecommendation,now=new Date()):WorldQuestContract{
  return {
    id:`${recommendation.category}:${recommendation.feature}`,
    feature:recommendation.feature,
    category:recommendation.category,
    title:recommendation.label,
    reason:recommendation.reason,
    acceptedAt:now.toISOString(),
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

export function saveWorldQuest(storage:Pick<Storage,'setItem'>|null|undefined,contract:WorldQuestContract){
  storage?.setItem(WORLD_QUEST_STORAGE_KEY,JSON.stringify(contract));
}

export function clearWorldQuest(storage:Pick<Storage,'removeItem'>|null|undefined){
  storage?.removeItem(WORLD_QUEST_STORAGE_KEY);
}
