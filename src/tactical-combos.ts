import type {BattleSession} from './tactical-battle';
import type {CompanionId} from './tactical-companions';
export type ComboUltimate={id:string;companion:CompanionId;mpCost:number;power:number};
const combos:Record<CompanionId,ComboUltimate>={bear:{id:'unyielding_pact',companion:'bear',mpCost:3,power:32},owl:{id:'starlight_chorus',companion:'owl',mpCost:3,power:30},wolf:{id:'lunar_hunt',companion:'wolf',mpCost:3,power:40},cat:{id:'phantom_waltz',companion:'cat',mpCost:3,power:36}};
export const comboForCompanion=(id:CompanionId)=>combos[id];
export function canUseCombo(session:BattleSession,id:CompanionId,bondLevel:number){const runa=session.units.find(x=>x.id==='runa');const mate=session.units.find(x=>x.id===`companion-${id}`);const c=combos[id];return bondLevel>=5&&!!runa&&runa.hp>0&&!!mate&&mate.hp>0&&runa.mp>=c.mpCost;}
export function resolveCombo(session:BattleSession,id:CompanionId,bondLevel:number,targetId:string):BattleSession{if(!canUseCombo(session,id,bondLevel))return session;const target=session.units.find(x=>x.id===targetId);if(!target||target.side!=='enemy'||target.hp<=0)return session;const c=combos[id];return {...session,units:session.units.map(x=>x.id==='runa'?{...x,mp:x.mp-c.mpCost}:x.id===targetId?{...x,hp:Math.max(0,x.hp-c.power)}:x)};}
