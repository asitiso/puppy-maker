export type IngredientId='moon_herb'|'forest_berry'|'golden_mushroom'|'star_salt'|'warm_milk'|'spirit_leaf';
export interface Destination {id:string;name:string;description:string;unlockMonth:number;firstReward:Partial<Record<IngredientId,number>>;repeatReward:Partial<Record<IngredientId,number>>;gold:number;reaction:string}
export const destinations:Destination[]=[
{id:'forest_path',name:'숲길',description:'루나와 처음 걷기 좋은 포근한 숲길',unlockMonth:1,firstReward:{forest_berry:2,moon_herb:1},repeatReward:{forest_berry:1},gold:40,reaction:'숲 냄새가 좋아요! 또 같이 걸어요.'},
{id:'moon_garden',name:'달빛 정원',description:'달빛 약초가 자라는 조용한 정원',unlockMonth:3,firstReward:{moon_herb:2,spirit_leaf:1},repeatReward:{moon_herb:1},gold:60,reaction:'달빛이 잎사귀 위에서 반짝여요.'},
{id:'village_market',name:'마을 시장',description:'재료와 이야기가 모이는 활기찬 시장',unlockMonth:4,firstReward:{warm_milk:2,star_salt:1},repeatReward:{warm_milk:1},gold:100,reaction:'맛있는 냄새가 잔뜩 나요!'},
{id:'old_shrine',name:'오래된 수호 제단',description:'수호령의 흔적이 남은 신비로운 장소',unlockMonth:7,firstReward:{spirit_leaf:2,golden_mushroom:1},repeatReward:{spirit_leaf:1},gold:120,reaction:'여기… 왠지 오래전부터 알고 있던 곳 같아요.'},
{id:'starlight_hill',name:'별빛 언덕',description:'긴 여정의 끝이 보이는 높은 언덕',unlockMonth:10,firstReward:{star_salt:2,golden_mushroom:2},repeatReward:{golden_mushroom:1},gold:160,reaction:'주인님, 우리가 걸어온 길이 다 보여요!'}];
export const ingredientNames:Record<IngredientId,string>={moon_herb:'달빛 약초',forest_berry:'숲열매',golden_mushroom:'황금 버섯',star_salt:'별소금',warm_milk:'따뜻한 우유',spirit_leaf:'수호잎'};
export const availableDestinations=(month:number)=>destinations.filter(d=>month>=d.unlockMonth);
export const destinationById=(id:string)=>destinations.find(d=>d.id===id);
export function explorationReward(id:string,discovered:string[]){const d=destinationById(id);if(!d)return null;return{ingredients:discovered.includes(id)?d.repeatReward:d.firstReward,gold:d.gold,firstDiscovery:!discovered.includes(id),reaction:d.reaction}}
