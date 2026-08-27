import type { BattleSession, TacticalUnit } from './tactical-battle';
import { isBattleFinished, orderedTimeline } from './tactical-battle';
import { tacticalAction, validTacticalTargets, type TacticalActionId } from './tactical-actions';
import { advanceTacticalStatuses, tacticalStatusPower } from './tactical-status';
import type { EquipmentEffect } from './v12-character-builds';

export type TacticalActionInput = { actorId:string; actionId:TacticalActionId; targetId:string; };
type PoweredTacticalUnit = TacticalUnit & {
  attackPower?:number;
  skillPower?:number;
  supportPower?:number;
  v12EquipmentEffects?:EquipmentEffect[];
};
const mpGainByAction:Record<TacticalActionId,number> = { attack:2, skill:3, support:2, special:0 };

export function nextTacticalActor(session:BattleSession):string|null {
  if(isBattleFinished(session))return null;
  return session.timeline.find(id => {
    const unit=session.units.find(entry=>entry.id===id);
    return Boolean(unit&&Number.isFinite(unit.hp)&&unit.hp>0&&!session.acted.includes(id));
  }) ?? null;
}

function applyDamage(target:TacticalUnit,rawDamage:number):TacticalUnit {
  const damage=Math.max(0,Math.floor(rawDamage));
  const shield=Number.isFinite(target.shield)?Math.max(0,Math.floor(target.shield)):0;
  const blocked=Math.min(shield,damage);
  return {...target,shield:shield-blocked,hp:Math.max(0,target.hp-(damage-blocked))};
}

function applySupport(target:TacticalUnit,power:number):TacticalUnit {
  return {...target,hp:Math.min(target.maxHp,target.hp+Math.max(0,Math.floor(power)))};
}

function actionPower(actor:PoweredTacticalUnit,actionId:TacticalActionId,basePower:number):number {
  let raw=basePower;
  if(actionId==='attack'&&Number.isFinite(actor.attackPower))raw=Math.max(0,Math.floor(actor.attackPower!));
  else if(actionId==='skill'&&Number.isFinite(actor.skillPower))raw=Math.max(0,Math.floor(actor.skillPower!));
  else if(actionId==='support'&&Number.isFinite(actor.supportPower))raw=Math.max(0,Math.floor(actor.supportPower!));
  else if(actionId==='special'){
    const strongest=Math.max(actor.attackPower??0,actor.skillPower??0,basePower);
    raw=Math.max(basePower,Math.floor(strongest*1.2));
  }
  return tacticalStatusPower(actor,raw);
}

function equipmentEffects(unit:TacticalUnit):EquipmentEffect[] {
  const effects=(unit as PoweredTacticalUnit).v12EquipmentEffects;
  return Array.isArray(effects)?effects:[];
}

function refreshRound(session:BattleSession):BattleSession {
  const units=session.units.map(unit=>unit.hp<=0?advanceTacticalStatuses(unit):{...advanceTacticalStatuses(unit),ap:unit.maxAp});
  return {...session,units,timeline:orderedTimeline(units),round:session.round+1,acted:[]};
}

export function completeTacticalTurn(session:BattleSession,actorId:string,units:TacticalUnit[]):BattleSession {
  const acted=[...session.acted,actorId];
  const next:BattleSession={...session,units,acted};
  if(isBattleFinished(next))return next;
  const livingIds=units.filter(unit=>Number.isFinite(unit.hp)&&unit.hp>0).map(unit=>unit.id);
  return livingIds.every(id=>acted.includes(id))?refreshRound(next):next;
}

export function skipTacticalTurnIfNoPlayableAction(session:BattleSession,actorId:string,hand:readonly TacticalActionId[]):BattleSession {
  if(isBattleFinished(session)||nextTacticalActor(session)!==actorId)return session;
  const actor=session.units.find(unit=>unit.id===actorId);
  if(!actor||!Number.isFinite(actor.hp)||actor.hp<=0||!Number.isFinite(actor.ap)||!Number.isFinite(actor.mp))return session;
  const hasPlayableAction=hand.some(actionId=>{
    const action=tacticalAction(actionId);
    return Boolean(action&&actor.ap>=action.apCost&&actor.mp>=action.mpCost&&validTacticalTargets(session,actorId,actionId).length>0);
  });
  return hasPlayableAction?session:completeTacticalTurn(session,actorId,session.units);
}

function resolveDamageWithEquipment(
  session:BattleSession,
  actor:PoweredTacticalUnit,
  target:TacticalUnit,
  actionId:TacticalActionId,
  power:number,
):Map<string,TacticalUnit> {
  const changed=new Map<string,TacticalUnit>();
  const actorEffects=equipmentEffects(actor);
  let targetDamage=power;

  if(actor.side==='ally'&&actionId==='attack'){
    const brooch=actorEffects.find(effect=>effect.kind==='coop_attack_boost');
    if(brooch?.kind==='coop_attack_boost')targetDamage+=Math.max(1,Math.floor(power*brooch.bonusRatio));
  }

  if(actor.side==='enemy'&&target.side==='ally'){
    const interceptor=session.units.find(unit=>unit.id!==target.id&&unit.side==='ally'&&unit.hp>0&&equipmentEffects(unit).some(effect=>effect.kind==='ally_intercept_counter'));
    const intercept=interceptor?equipmentEffects(interceptor).find(effect=>effect.kind==='ally_intercept_counter'):undefined;
    if(interceptor&&intercept?.kind==='ally_intercept_counter'){
      const intercepted=Math.max(1,Math.floor(power*intercept.interceptRatio));
      targetDamage=Math.max(0,power-intercepted);
      changed.set(interceptor.id,applyDamage(interceptor,intercepted));
      changed.set(actor.id,applyDamage(actor,Math.max(1,Math.floor(intercepted*.5))));
    }
  }

  changed.set(target.id,applyDamage(target,targetDamage));

  if(actor.side==='ally'&&actionId==='skill'&&actorEffects.some(effect=>effect.kind==='chain_magic')){
    const chained=session.units
      .filter(unit=>unit.side!==actor.side&&unit.hp>0&&unit.id!==target.id)
      .sort((a,b)=>a.id.localeCompare(b.id))[0];
    if(chained)changed.set(chained.id,applyDamage(chained,Math.max(1,Math.floor(power*.5))));
  }

  return changed;
}

export function resolveTacticalAction(session:BattleSession,input:TacticalActionInput):BattleSession {
  if(isBattleFinished(session))return session;
  if(nextTacticalActor(session)!==input.actorId)return session;
  const actor=session.units.find(unit=>unit.id===input.actorId) as PoweredTacticalUnit|undefined;
  if(!actor||!Number.isFinite(actor.hp)||actor.hp<=0||!Number.isFinite(actor.ap)||!Number.isFinite(actor.mp))return session;
  const action=tacticalAction(input.actionId);
  if(!action||actor.ap<action.apCost||actor.mp<action.mpCost)return session;
  if(!validTacticalTargets(session,input.actorId,input.actionId).includes(input.targetId))return session;
  const target=session.units.find(unit=>unit.id===input.targetId);
  if(!target)return session;
  const power=actionPower(actor,input.actionId,action.power);
  const changed=input.actionId==='support'
    ? new Map<string,TacticalUnit>([[target.id,applySupport(target,power)]])
    : resolveDamageWithEquipment(session,actor,target,input.actionId,power);
  const units=session.units.map(unit=>{
    let next:TacticalUnit=changed.get(unit.id)??unit;
    if(unit.id===input.actorId){
      const changedActor=changed.get(unit.id)??unit;
      next={...changedActor,ap:changedActor.ap-action.apCost,mp:Math.min(changedActor.maxMp,changedActor.mp-action.mpCost+mpGainByAction[input.actionId])};
    }
    return next;
  });
  return completeTacticalTurn(session,input.actorId,units);
}
