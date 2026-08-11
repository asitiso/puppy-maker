import type{EndingId}from'./endings';import type{Stats}from'../game';
// Section 3.1 of the design doc calls for genetic traits that carry from
// one generation to the next after an ending. We scope that to a single
// inherited trait per run (not the full 3-slot passive/active system the
// doc sketches) so the mechanic is honest about what it actually does:
// a one-time starting-stat bonus for the next generation, not an ongoing
// success-rate modifier we don't have hooks to apply consistently.
export type TraitId='mana_gift'|'swift_step'|'golden_touch'|'wild_palate';
export interface GeneticTrait{id:TraitId;name:string;description:string;statBonus:Partial<Stats>}
export const GENETIC_TRAITS:Record<TraitId,GeneticTrait>={
 mana_gift:{id:'mana_gift',name:'마력 보유',description:'다음 세대는 마력을 품고 태어나요',statBonus:{magic:10,intelligence:4}},
 swift_step:{id:'swift_step',name:'신속',description:'다음 세대는 더 날렵하게 태어나요',statBonus:{strength:10,morality:2}},
 golden_touch:{id:'golden_touch',name:'황금의 손',description:'다음 세대는 여윳돈과 함께 시작해요',statBonus:{morality:6,affection:4}},
 wild_palate:{id:'wild_palate',name:'야성 미각',description:'다음 세대는 스트레스에 더 잘 견뎌요',statBonus:{stress:-10,affection:6}},
};
// Each ending leans toward the trait that best matches how it was earned.
const endingTrait:Record<EndingId,TraitId>={guardian:'swift_step',sage:'mana_gift',healer:'wild_palate',explorer:'swift_step',companion:'golden_touch',balanced:'mana_gift'};
export function traitForEnding(ending:EndingId):TraitId{return endingTrait[ending]}
export function applyTraitBonus(stats:Stats,traitId?:TraitId):Stats{if(!traitId)return stats;const bonus=GENETIC_TRAITS[traitId].statBonus,next={...stats};(Object.keys(bonus)as(keyof Stats)[]).forEach(key=>{next[key]=Math.max(0,Math.min(100,next[key]+(bonus[key]??0)))});return next}
