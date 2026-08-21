import type { BattleSession, TacticalUnit } from './tactical-battle';
import { isBattleFinished, orderedTimeline, repairTacticalHealth } from './tactical-battle';
import { tacticalAction, validTacticalTargets, type TacticalActionId } from './tactical-actions';
import { advanceTacticalStatuses, tacticalStatusPower } from './tactical-status';

export type TacticalActionInput = { actorId:string; actionId:TacticalActionId; targetId:string; };
type PoweredTacticalUnit = TacticalUnit & { attackPower?:number; skillPower?:number; supportPower?:number; };
const mpGainByAction:Record<TacticalActionId,number> = { attack:2, skill:3, support:2, special:0 };
const TACTICAL_AP_CAP=3;
const TACTICAL_MP_CAP=10;
export function nextTacticalActor(session:BattleSession):string|null { if(isBattleFinished(session))return null;return session.timeline.find(id => { const unit=session.units.find(entry=>entry.id===id); return Boolean(unit&&Number.isFinite(unit.hp)&&unit.hp>0&&!session.acted.includes(id)); }) ?? null; }
function applyDamage(target:TacticalUnit,rawDamage:number):TacticalUnit { const safe=repairTacticalHealth(target),damage=Math.max(0,Math.floor(rawDamage)),shield=Number.isFinite(safe.shield)?Math.max(0,Math.floor(safe.shield)):0,blocked=Math.min(shield,damage); return {...safe,shield:shield-blocked,hp:Math.max(0,safe.hp-(damage-blocked))}; }
function applySupport(target:TacticalUnit,power:number):TacticalUnit { const safe=repairTacticalHealth(target);return {...safe,hp:Math.min(safe.maxHp,safe.hp+Math.max(0,Math.floor(power)))}; }
function actionPower(actor:PoweredTacticalUnit,actionId:TacticalActionId,basePower:number):number { let raw=basePower;if(actionId==='attack'&&Number.isFinite(actor.attackPower))raw=Math.max(0,Math.floor(actor.attackPower!));else if(actionId==='skill'&&Number.isFinite(actor.skillPower))raw=Math.max(0,Math.floor(actor.skillPower!));else if(actionId==='support'&&Number.isFinite(actor.supportPower))raw=Math.max(0,Math.floor(actor.supportPower!));else if(actionId==='special'){const strongest=Math.max(actor.attackPower??0,actor.skillPower??0,basePower);raw=Math.max(basePower,Math.floor(strongest*1.2));}return tacticalStatusPower(actor,raw); }
function repairResourceUnit(unit:TacticalUnit):TacticalUnit {
 const rawAp=Number.isFinite(unit.ap)?Math.max(0,Math.floor(unit.ap)):0;
 const rawMp=Number.isFinite(unit.mp)?Math.max(0,Math.floor(unit.mp)):0;
 const fallbackMaxAp=Math.max(1,Math.min(TACTICAL_AP_CAP,rawAp||1));
 const fallbackMaxMp=Math.max(0,Math.min(TACTICAL_MP_CAP,rawMp));
 const maxAp=Number.isFinite(unit.maxAp)?Math.max(1,Math.min(TACTICAL_AP_CAP,Math.floor(unit.maxAp))):fallbackMaxAp;
 const maxMp=Number.isFinite(unit.maxMp)?Math.max(0,Math.min(TACTICAL_MP_CAP,Math.floor(unit.maxMp))):fallbackMaxMp;
 const ap=Math.min(rawAp,maxAp);
 const mp=Math.min(rawMp,maxMp);
 return ap===unit.ap&&mp===unit.mp&&maxAp===unit.maxAp&&maxMp===unit.maxMp?unit:{...unit,ap,mp,maxAp,maxMp};
}
function refreshRound(session:BattleSession):BattleSession { const units=session.units.map(unit=>{const advanced=repairResourceUnit(advanceTacticalStatuses(unit));return advanced.hp<=0?advanced:{...advanced,ap:advanced.maxAp};});return {...session,units,timeline:orderedTimeline(units),round:session.round+1,acted:[]}; }
export function completeTacticalTurn(session:BattleSession,actorId:string,units:TacticalUnit[]):BattleSession { if(isBattleFinished(session))return session;const acted=[...session.acted,actorId],next:BattleSession={...session,units,acted};if(isBattleFinished(next))return next;const livingIds=units.filter(unit=>Number.isFinite(unit.hp)&&unit.hp>0).map(unit=>unit.id);return livingIds.every(id=>acted.includes(id))?refreshRound(next):next; }
function repairRuntimeResources(session:BattleSession,actorId:string):BattleSession {
 const actor=session.units.find(unit=>unit.id===actorId);if(!actor)return session;
 const repairedActor=repairResourceUnit(actor);if(repairedActor===actor)return session;
 const units=session.units.map(unit=>unit.id===actorId?repairedActor:unit);
 return {...session,units};
}
export function skipTacticalTurnIfNoPlayableAction(session:BattleSession,actorId:string,hand:readonly TacticalActionId[]):BattleSession {
 if(isBattleFinished(session)||nextTacticalActor(session)!==actorId)return session;
 const repaired=repairRuntimeResources(session,actorId);
 const actor=repaired.units.find(unit=>unit.id===actorId);if(!actor||!Number.isFinite(actor.hp)||actor.hp<=0)return session;
 const hasPlayableAction=hand.some(actionId=>{const action=tacticalAction(actionId);return Boolean(action&&actor.ap>=action.apCost&&actor.mp>=action.mpCost&&validTacticalTargets(repaired,actorId,actionId).length>0);});
 return hasPlayableAction?repaired:completeTacticalTurn(repaired,actorId,repaired.units);
}
export function resolveTacticalAction(session:BattleSession,input:TacticalActionInput):BattleSession {
 if(isBattleFinished(session))return session;
 const repaired=repairRuntimeResources(session,input.actorId);if(nextTacticalActor(repaired)!==input.actorId)return repaired;
 const actor=repaired.units.find(unit=>unit.id===input.actorId) as PoweredTacticalUnit|undefined;if(!actor||!Number.isFinite(actor.hp)||actor.hp<=0)return repaired;
 const action=tacticalAction(input.actionId);if(!action||actor.ap<action.apCost||actor.mp<action.mpCost)return repaired;if(!validTacticalTargets(repaired,input.actorId,input.actionId).includes(input.targetId))return repaired;
 const power=actionPower(actor,input.actionId,action.power);
 const units=repaired.units.map(unit=>{let next:TacticalUnit=unit;if(unit.id===input.targetId)next=input.actionId==='support'?applySupport(next,power):applyDamage(next,power);if(unit.id===input.actorId)next={...next,ap:next.ap-action.apCost,mp:Math.min(next.maxMp,next.mp-action.mpCost+mpGainByAction[input.actionId])};return next;});
 return completeTacticalTurn(repaired,input.actorId,units);
}