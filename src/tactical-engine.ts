import type { BattleSession, TacticalUnit } from './tactical-battle';
import { isBattleFinished, orderedTimeline } from './tactical-battle';
import { tacticalAction, validTacticalTargets, type TacticalActionId } from './tactical-actions';

export type TacticalActionInput = {
  actorId:string;
  actionId:TacticalActionId;
  targetId:string;
};

type PoweredTacticalUnit = TacticalUnit & {
  attackPower?:number;
  skillPower?:number;
  supportPower?:number;
};

const mpGainByAction:Record<TacticalActionId,number> = {
  attack:2,
  skill:3,
  support:2,
  special:0,
};

export function nextTacticalActor(session:BattleSession):string|null {
  return session.timeline.find(id => {
    const unit = session.units.find(entry => entry.id === id);
    return Boolean(unit && unit.hp > 0 && !session.acted.includes(id));
  }) ?? null;
}

function applyDamage(target:TacticalUnit,rawDamage:number):TacticalUnit {
  const damage = Math.max(0,Math.floor(rawDamage));
  const blocked = Math.min(target.shield,damage);
  return {
    ...target,
    shield:target.shield - blocked,
    hp:Math.max(0,target.hp - (damage - blocked)),
  };
}

function applySupport(target:TacticalUnit,power:number):TacticalUnit {
  return { ...target, hp:Math.min(target.maxHp,target.hp + Math.max(0,Math.floor(power))) };
}

function actionPower(actor:PoweredTacticalUnit,actionId:TacticalActionId,basePower:number):number {
  if (actionId === 'attack' && Number.isFinite(actor.attackPower)) return Math.max(0,Math.floor(actor.attackPower!));
  if (actionId === 'skill' && Number.isFinite(actor.skillPower)) return Math.max(0,Math.floor(actor.skillPower!));
  if (actionId === 'support' && Number.isFinite(actor.supportPower)) return Math.max(0,Math.floor(actor.supportPower!));
  if (actionId === 'special') {
    const strongest = Math.max(actor.attackPower ?? 0,actor.skillPower ?? 0,basePower);
    return Math.max(basePower,Math.floor(strongest * 1.2));
  }
  return basePower;
}

function refreshRound(session:BattleSession):BattleSession {
  const units = session.units.map(unit => unit.hp > 0 ? { ...unit, ap:unit.maxAp } : unit);
  return {
    ...session,
    units,
    timeline:orderedTimeline(units),
    round:session.round + 1,
    acted:[],
  };
}

export function resolveTacticalAction(session:BattleSession,input:TacticalActionInput):BattleSession {
  if (isBattleFinished(session)) return session;
  if (nextTacticalActor(session) !== input.actorId) return session;
  const actor = session.units.find(unit => unit.id === input.actorId) as PoweredTacticalUnit|undefined;
  if (!actor || actor.hp <= 0) return session;
  const action = tacticalAction(input.actionId);
  if (actor.ap < action.apCost || actor.mp < action.mpCost) return session;
  if (!validTacticalTargets(session,input.actorId,input.actionId).includes(input.targetId)) return session;
  const power = actionPower(actor,input.actionId,action.power);

  const units = session.units.map(unit => {
    if (unit.id === input.actorId) {
      return {
        ...unit,
        ap:unit.ap - action.apCost,
        mp:Math.min(unit.maxMp,unit.mp - action.mpCost + mpGainByAction[input.actionId]),
      };
    }
    if (unit.id !== input.targetId) return unit;
    return input.actionId === 'support' ? applySupport(unit,power) : applyDamage(unit,power);
  });

  const acted = [...session.acted,input.actorId];
  const next:BattleSession = { ...session, units, acted };
  if (isBattleFinished(next)) return next;
  const livingIds = units.filter(unit => unit.hp > 0).map(unit => unit.id);
  return livingIds.every(id => acted.includes(id)) ? refreshRound(next) : next;
}
