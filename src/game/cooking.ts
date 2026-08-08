import type {IngredientId} from './exploration';
export interface Recipe {id:string;name:string;description:string;unlockMonth:number;ingredients:Partial<Record<IngredientId,number>>;effect:{fatigue?:number;stress?:number;affection?:number;trainingBoost?:number}}
export const recipes:Recipe[]=[
{id:'berry_milk',name:'숲열매 밀크',description:'피로를 부드럽게 풀어주는 달콤한 한 잔',unlockMonth:1,ingredients:{forest_berry:1,warm_milk:1},effect:{fatigue:-12,affection:1}},
{id:'moon_tea',name:'달빛 허브티',description:'마음을 차분하게 정돈하는 따뜻한 차',unlockMonth:3,ingredients:{moon_herb:2},effect:{stress:-15}},
{id:'forest_stew',name:'숲의 버섯 스튜',description:'다음 훈련을 든든하게 준비하는 스튜',unlockMonth:5,ingredients:{golden_mushroom:1,moon_herb:1,star_salt:1},effect:{fatigue:-8,trainingBoost:8}},
{id:'guardian_soup',name:'수호령 수프',description:'루나와의 유대를 깊게 만드는 특별식',unlockMonth:8,ingredients:{spirit_leaf:2,warm_milk:1,star_salt:1},effect:{stress:-10,affection:3,trainingBoost:5}},
{id:'starlight_plate',name:'별빛 만찬',description:'긴 여정의 마지막을 응원하는 작은 축제',unlockMonth:10,ingredients:{golden_mushroom:2,star_salt:2,forest_berry:1},effect:{fatigue:-15,stress:-15,affection:4,trainingBoost:10}}];
export const recipeById=(id:string)=>recipes.find(r=>r.id===id);
export const unlockedRecipes=(month:number,discovered:string[])=>recipes.filter(r=>month>=r.unlockMonth&&(r.unlockMonth<8||discovered.includes('old_shrine')));
export function canCook(recipe:Recipe,inventory:Partial<Record<IngredientId,number>>){return Object.entries(recipe.ingredients).every(([id,count])=>(inventory[id as IngredientId]??0)>=(count??0))}
export function consumeIngredients(recipe:Recipe,inventory:Partial<Record<IngredientId,number>>){if(!canCook(recipe,inventory))return null;const next={...inventory};for(const[id,count]of Object.entries(recipe.ingredients)){const key=id as IngredientId;next[key]=(next[key]??0)-(count??0)}return next}
