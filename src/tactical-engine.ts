import type { BattleSession, TacticalUnit } from './tactical-battle';
import { isBattleFinished, orderedTimeline } from './tactical-battle';
import { tacticalAction, validTacticalTargets, type TacticalActionId } from './tactical-actions';
import { advanceTacticalStatuses, tacticalStatusPower } from './tactical-status';

export type TacticalActionInput = { actorId:string; actionId:TacticalActionId; targetId:string; };
type PoweredTacticalUnit = TacticalUnit & { attackPower?:number; skillPower?:number; supportPower?:number; };
const mpGainByAction:Record<TacticalActionId,number> = { attack:2, skill:3, support:2, special:0 };
export function nextTacticalActor(session:BattleSession):string|null { return session.timeline.find(id => { const unit=session.units.find(entry=>entry.id===id); return Boolean(unit&&unit.hp>0&&!session.acted.includes(id)); }) ?? null; }
function applyDamage(target:TacticalUnit,rawDamage:number):TacticalUnit { const damage=Math.max(0,Math.floor(rawDamage)),blocked=Math.min(target.shield,damage); return {...target,shield:target.shield-blocked,hp:Math.max(0,target.hp-(damage-blocked))}; }
function applySupport(target:TacticalUnit,power:number):TacticalUnit { return {...target,hp:Math.min(target.maxHp,target.hp+Math.max(0,Math.floor(power)))}; }
function actionPower(actor:PoweredTacticalUnit,actionId:TacticalActionId,basePower:number):number { let raw=basePower;if(actionId==='attack'&&Number.isFinite(actor.attackPower))raw=Math.max(0,Math.floor(actor.attackPower!));else if(actionId==='skill'&&Number.isFinite(actor.skillPower))raw=Math.max(0,Math.floor(actor.skillPower!));else if(actionId==='support'&&Number.isFinite(actor.supportPower))raw=Math.max(0,Math.floor(actor.supportPower!));else if(actionId==='special'){const strongest=Math.max(actor.attackPower??0,actor.skillPower??0,basePower);raw=Math.max(basePower,Math.floor(strongest*1.2));}return tacticalStatusPower(actor,raw); }
function refreshRound(session:BattleSession):BattleSession { const units=session.units.map(unit=>unit.hp<=0?advanceTacticalStatuses(unit):{...advanceTacticalStatuses(unit),ap:unit.maxAp});return {...session,units,timeline:orderedTimeline(units),round:session.round+1,acted:[]}; }
export function completeTacticalTurn(session:BattleSession,actorId:string,units:TacticalUnit[]):BattleSession { const acted=[...session.acted,actorId],next:BattleSession={...session,units,acted};if(isBattleFinished(next))return next;const livingIds=units.filter(unit=>unit.hp>0).map(unit=>unit.id);return livingIds.every(id=>acted.includes(id))?refreshRound(next):next; }
export function resolveTacticalAction(session:BattleSession,input:TacticalActionInput):BattleSession {
 if(isBattleFinished(session))return session;if(nextTacticalActor(session)!==input.actorId)return session;
 const actor=session.units.find(unit=>unit.id===input.actorId) as PoweredTacticalUnit|undefined;if(!actor||actor.hp<=0)return session;
 const action=tacticalAction(input.actionId);if(actor.ap<action.apCost||actor.mp<action.mpCost)return session;if(!validTacticalTargets(session,input.actorId,input.actionId).includes(input.targetId))return session;
 const power=actionPower(actor,input.actionId,action.power);
 const units=session.units.map(unit=>{let next:TacticalUnit=unit;if(unit.id===input.targetId)next=input.actionId==='support'?applySupport(next,power):applyDamage(next,power);if(unit.id===input.actorId)next={...next,ap:next.ap-action.apCost,mp:Math.min(next.maxMp,next.mp-action.mpCost+mpGainByAction[input.actionId])};return next;});
 return completeTacticalTurn(session,input.actorId,units);
}
