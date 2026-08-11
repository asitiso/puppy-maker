import type{EngineModifiers}from'./runtime';
// GDD 3.5 sketches a 4-card skill deck (fireball / heal / shield / focus)
// drawn each turn in a full tactical battle. We don't have that battle
// engine, so this reuses the cards as a single pre-round pick that leans
// the existing timing/tap/sequence/balance/choice minigame toward one of
// four playstyles — same four identities, honest about what they do here.
export type SkillCardId='fireball'|'heal'|'shield'|'focus';
export interface SkillCard{id:SkillCardId;name:string;tone:string;description:string}
export const SKILL_CARDS:SkillCard[]=[
 {id:'fireball',name:'파이어볼',tone:'fire',description:'루나의 보조 효과 강화 · 판정이 조금 더 후해져요'},
 {id:'heal',name:'치유의 빛',tone:'heal',description:'실수 페널티 감소 · 놓쳐도 점수가 덜 깎여요'},
 {id:'shield',name:'수호의 막',tone:'shield',description:'PERFECT 판정 범위 확대 · 조준이 더 관대해져요'},
 {id:'focus',name:'마력 집중',tone:'focus',description:'FEVER 콤보 요구치 감소 · 배수 보너스가 더 빨리 붙어요'},
];
export function applySkillCard(modifiers:EngineModifiers,cardId:SkillCardId|null):EngineModifiers{
 if(!cardId)return modifiers;
 if(cardId==='fireball')return{...modifiers,assist:(modifiers.assist??0)+.05};
 if(cardId==='heal')return{...modifiers,hazardPenalty:Math.round((modifiers.hazardPenalty??30)*.7),choicePenalty:Math.round((modifiers.choicePenalty??15)*.7)};
 if(cardId==='shield')return{...modifiers,perfectWindow:Math.max(.6,(modifiers.perfectWindow??.9)-.05),balanceTolerance:(modifiers.balanceTolerance??32)+8};
 return{...modifiers,feverCombo:Math.max(2,(modifiers.feverCombo??4)-1)};
}
