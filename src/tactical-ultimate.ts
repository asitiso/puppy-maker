import type { BattleSession, TacticalUnit } from './tactical-battle';
import { isBattleFinished } from './tactical-battle';
import type { CompanionId } from './tactical-companions';
import { completeTacticalTurn, nextTacticalActor } from './tactical-engine';
import { addTacticalStatus } from './tactical-status';

export type CombinationUltimateDefinition = {
  companionId:CompanionId;
  label:string;
  target:'ally'|'enemy';
  mpCost:number;
  power:number;
};

export type CombinationUltimateInput = {
  actorId:string;
  companionId:CompanionId;
  bondLevel:number;
  targetId:string;
};

const ultimates:Record<CompanionId,CombinationUltimateDefinition> = {
  bear:{ companionId:'bear',label:'Starlight Guardian Formation',target:'ally',mpCost:10,power:28 },
  owl:{ companionId:'owl',label:'Moonlight Prayer',target:'ally',mpCost:10,power:34 },
  wolf:{ companionId:'wolf',label:'Twin Moon Assault',target:'enemy',mpCost:10,power:64 },
  cat:{ companionId:'cat',label:'Phantom Dance',target:'enemy',mpCost:10,power:44 },
};

export function combinationUltimateFor(companionId:CompanionId):CombinationUltimateDefinition {
  return ultimates[companionId];
}

function livingPartner(session:BattleSession,companionId:CompanionId) {
  return session.units.find(unit => unit.id === `companion-${companionId}` && unit.side === 'ally' && Number.isFinite(unit.hp) && unit.hp > 0) ?? null;
}

export function validCombinationUltimateTargets(
  session:BattleSession,
  actorId:string,
  companionId:CompanionId,
  bondLevel:number,
):string[] {
  const actor = session.units.find(unit => unit.id === actorId);
  const ultimate = combinationUltimateFor(companionId);
  if (
    isBattleFinished(session) ||
    actorId !== 'runa' ||
    !actor ||
    actor.side !== 'ally' ||
    !Number.isFinite(actor.hp) ||
    actor.hp <= 0 ||
    !Number.isFinite(actor.mp) ||
    nextTacticalActor(session) !== actorId ||
    !Number.isFinite(bondLevel) ||
    bondLevel < 5 ||
    actor.mp < ultimate.mpCost ||
    !livingPartner(session,companionId)
  ) return [];

  return session.units
    .filter(unit => Number.isFinite(unit.hp) && unit.hp > 0 && (ultimate.target === 'ally' ? unit.side === actor.side : unit.side !== actor.side))
    .map(unit => unit.id)
    .sort();
}

function damage(target:TacticalUnit,power:number):TacticalUnit {
  const raw = Math.max(0,Math.floor(power));
  const shield = Number.isFinite(target.shield) ? Math.max(0,Math.floor(target.shield)) : 0;
  const blocked = Math.min(shield,raw);
  return { ...target,shield:shield-blocked,hp:Math.max(0,target.hp-(raw-blocked)) };
}

export function resolveCombinationUltimate(session:BattleSession,input:CombinationUltimateInput):BattleSession {
  const ultimate = combinationUltimateFor(input.companionId);
  const validTargets = validCombinationUltimateTargets(session,input.actorId,input.companionId,input.bondLevel);
  if (!validTargets.includes(input.targetId)) return session;

  const units = session.units.map(unit => {
    let next:TacticalUnit = unit;
    if (input.companionId === 'bear' && unit.side === 'ally' && Number.isFinite(unit.hp) && unit.hp > 0) {
      const shield = Number.isFinite(next.shield) ? Math.max(0,Math.floor(next.shield)) : 0;
      next = { ...next,shield:shield+ultimate.power };
    } else if (input.companionId === 'owl' && unit.side === 'ally' && Number.isFinite(unit.hp) && unit.hp > 0) {
      next = addTacticalStatus({ ...next,hp:Math.min(next.maxHp,next.hp+ultimate.power) },'regen',2);
    } else if (input.companionId === 'wolf' && unit.id === input.targetId) {
      next = damage(next,ultimate.power);
    } else if (input.companionId === 'cat' && unit.id === input.targetId) {
      next = addTacticalStatus(damage(next,ultimate.power),'break',2);
    }
    if (unit.id === input.actorId) next = { ...next,mp:Math.max(0,next.mp-ultimate.mpCost) };
    return next;
  });

  return completeTacticalTurn(session,input.actorId,units);
}