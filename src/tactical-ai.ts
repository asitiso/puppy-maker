import type {BattleSession,TacticalUnit,TacticalEnemyArchetype} from './tactical-battle';
import {validTacticalTargets} from './tactical-actions';
import type {CompanionId} from './tactical-companions';
import type {TacticalActionInput} from './tactical-engine';
import {tacticalActionHand} from './tactical-hand';
import {validCombinationUltimateTargets,type CombinationUltimateInput} from './tactical-ultimate';
export type EnemyArchetype=TacticalEnemyArchetype;
export type AiAction={kind:'attack'|'guard'|'hex'|'heal';targetId:string};
const living=(xs:TacticalUnit[])=>xs.filter(x=>Number.isFinite(x.hp)&&x.hp>0);
const lowest=(xs:TacticalUnit[])=>living(xs).slice().sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)||a.id.localeCompare(b.id))[0];
const safeSeed=(seed:number)=>Number.isFinite(seed)?Math.floor(seed):0;
export function chooseEnemyAction(kind:EnemyArchetype,actor:TacticalUnit,allies:TacticalUnit[],enemies:TacticalUnit[]):AiAction|null{if(!Number.isFinite(actor.hp)||actor.hp<=0)return null;const foe=lowest(allies);if(!foe)return null;if(kind==='medic'){const patient=lowest(enemies);if(patient&&patient.hp<patient.maxHp)return {kind:'heal',targetId:patient.id};}if(kind==='guardian'&&actor.shield<15)return {kind:'guard',targetId:actor.id};if(kind==='hexer')return {kind:'hex',targetId:foe.id};return {kind:'attack',targetId:(kind==='assassin'?lowest(allies):living(allies)[0]??foe)?.id??foe.id};}
export function chooseAutoAction(actor:TacticalUnit,enemies:TacticalUnit[]):AiAction|null{if(!Number.isFinite(actor.hp)||actor.hp<=0)return null;const target=lowest(enemies);return target?{kind:'attack',targetId:target.id}:null;}

export function chooseAutoCombinationUltimate(session:BattleSession,party:readonly CompanionId[],bondLevels:Partial<Record<CompanionId,number>>):CombinationUltimateInput|null {
  const available=(companionId:CompanionId)=>{
    if(!party.includes(companionId))return null;
    const bondLevel=bondLevels[companionId]??1;
    const targetIds=validCombinationUltimateTargets(session,'runa',companionId,bondLevel);
    return targetIds.length?{companionId,bondLevel,targetIds}:null;
  };
  const allies=session.units.filter(unit=>unit.side==='ally'&&Number.isFinite(unit.hp)&&unit.hp>0);
  const enemies=session.units.filter(unit=>unit.side==='enemy'&&Number.isFinite(unit.hp)&&unit.hp>0);
  const owl=available('owl');
  const owlPatient=owl?lowest(allies.filter(unit=>owl.targetIds.includes(unit.id))):undefined;
  if(owl&&owlPatient&&owlPatient.hp/owlPatient.maxHp<=.55)return {actorId:'runa',companionId:'owl',bondLevel:owl.bondLevel,targetId:owlPatient.id};
  const bear=available('bear');
  const vulnerable=bear?lowest(allies.filter(unit=>bear.targetIds.includes(unit.id))):undefined;
  if(bear&&vulnerable&&vulnerable.hp/vulnerable.maxHp<=.65)return {actorId:'runa',companionId:'bear',bondLevel:bear.bondLevel,targetId:vulnerable.id};
  for(const companionId of ['wolf','cat'] as const){
    const offensive=available(companionId);
    if(!offensive)continue;
    const target=lowest(enemies.filter(unit=>offensive.targetIds.includes(unit.id)));
    if(target)return {actorId:'runa',companionId,bondLevel:offensive.bondLevel,targetId:target.id};
  }
  if(bear&&vulnerable)return {actorId:'runa',companionId:'bear',bondLevel:bear.bondLevel,targetId:vulnerable.id};
  if(owl&&owlPatient&&owlPatient.hp<owlPatient.maxHp)return {actorId:'runa',companionId:'owl',bondLevel:owl.bondLevel,targetId:owlPatient.id};
  return null;
}

function legalTarget(session:BattleSession,actorId:string,actionId:TacticalActionInput['actionId'],candidates:TacticalUnit[]):TacticalUnit|undefined{
  const targetIds=validTacticalTargets(session,actorId,actionId);
  return lowest(candidates.filter(unit=>targetIds.includes(unit.id)));
}

function chooseArchetypeEngineAction(session:BattleSession,actor:TacticalUnit,hand:readonly TacticalActionInput['actionId'][]):TacticalActionInput|null{
  const archetype=actor.aiArchetype;
  if(!archetype||actor.side!=='enemy')return null;
  const allies=session.units.filter(unit=>unit.side===actor.side&&Number.isFinite(unit.hp)&&unit.hp>0);
  const enemies=session.units.filter(unit=>unit.side!==actor.side&&Number.isFinite(unit.hp)&&unit.hp>0);
  const has=(actionId:TacticalActionInput['actionId'])=>hand.includes(actionId);
  const patient=lowest(allies);
  const supportThreshold=archetype==='medic' ? 0.8 : archetype==='guardian' ? 0.65 : 0;
  if(supportThreshold&&has('support')&&patient&&patient.hp/patient.maxHp<=supportThreshold&&validTacticalTargets(session,actor.id,'support').includes(patient.id))return {actorId:actor.id,actionId:'support',targetId:patient.id};
  const priorities:TacticalActionInput['actionId'][]=archetype==='guardian'?['attack','skill']:['skill','attack'];
  for(const actionId of priorities){
    if(!has(actionId))continue;
    const target=legalTarget(session,actor.id,actionId,enemies);
    if(target)return {actorId:actor.id,actionId,targetId:target.id};
  }
  return null;
}

export function chooseTacticalEngineAction(session:BattleSession,actorId:string,seed:number):TacticalActionInput|null {
  const actor=session.units.find(unit=>unit.id===actorId);
  if(!actor||!Number.isFinite(actor.hp)||actor.hp<=0)return null;
  const allies=session.units.filter(unit=>unit.side===actor.side&&Number.isFinite(unit.hp)&&unit.hp>0);
  const enemies=session.units.filter(unit=>unit.side!==actor.side&&Number.isFinite(unit.hp)&&unit.hp>0);
  if(!enemies.length)return null;
  const hand=tacticalActionHand(session,actorId);
  const has=(actionId:TacticalActionInput['actionId'])=>hand.includes(actionId);
  if(has('special')&&actor.mp>=actor.maxMp){const targets=validTacticalTargets(session,actorId,'special');const target=lowest(enemies.filter(unit=>targets.includes(unit.id)));if(target)return{actorId,actionId:'special',targetId:target.id};}
  const archetypeAction=chooseArchetypeEngineAction(session,actor,hand);
  if(archetypeAction)return archetypeAction;
  const patient=lowest(allies);
  if(has('support')&&patient&&patient.hp/patient.maxHp<=.4&&validTacticalTargets(session,actorId,'support').includes(patient.id))return{actorId,actionId:'support',targetId:patient.id};
  if(has('attack')){
    const attackTargets=validTacticalTargets(session,actorId,'attack');
    const exposed=enemies.filter(unit=>attackTargets.includes(unit.id));
    if(exposed.length){const sorted=exposed.slice().sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)||a.id.localeCompare(b.id));const minRatio=sorted[0].hp/sorted[0].maxHp;const tied=sorted.filter(unit=>unit.hp/unit.maxHp===minRatio);const target=tied[Math.abs(safeSeed(seed))%tied.length];return{actorId,actionId:'attack',targetId:target.id};}
  }
  if(has('skill')){const target=legalTarget(session,actorId,'skill',enemies);if(target)return{actorId,actionId:'skill',targetId:target.id};}
  if(has('support')&&patient){const supportTargets=validTacticalTargets(session,actorId,'support');if(supportTargets.includes(patient.id))return{actorId,actionId:'support',targetId:patient.id};}
  if(has('special')){const target=legalTarget(session,actorId,'special',enemies);if(target)return{actorId,actionId:'special',targetId:target.id};}
  return null;
}