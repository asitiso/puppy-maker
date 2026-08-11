import type {BattleSession,TacticalUnit} from './tactical-battle';
import {validTacticalTargets} from './tactical-actions';
import type {TacticalActionInput} from './tactical-engine';
export type EnemyArchetype='brute'|'guardian'|'hexer'|'medic'|'assassin';
export type AiAction={kind:'attack'|'guard'|'hex'|'heal';targetId:string};
const living=(xs:TacticalUnit[])=>xs.filter(x=>x.hp>0);
const lowest=(xs:TacticalUnit[])=>living(xs).slice().sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)||a.id.localeCompare(b.id))[0];
export function chooseEnemyAction(kind:EnemyArchetype,actor:TacticalUnit,allies:TacticalUnit[],enemies:TacticalUnit[]):AiAction{const foe=lowest(allies);if(kind==='medic'){const patient=lowest(enemies);if(patient&&patient.hp<patient.maxHp)return {kind:'heal',targetId:patient.id};}if(kind==='guardian'&&actor.shield<15)return {kind:'guard',targetId:actor.id};if(kind==='hexer'&&foe)return {kind:'hex',targetId:foe.id};return {kind:'attack',targetId:(kind==='assassin'?lowest(allies):living(allies)[0]??foe)?.id??actor.id};}
export function chooseAutoAction(actor:TacticalUnit,enemies:TacticalUnit[]):AiAction{const target=lowest(enemies);return {kind:'attack',targetId:target?.id??actor.id};}
export function applyAiAction(units:TacticalUnit[],actorId:string,action:AiAction){const actor=units.find(x=>x.id===actorId);if(!actor||actor.hp<=0)return units;return units.map(x=>{if(x.id!==action.targetId)return x;if(action.kind==='heal')return {...x,hp:Math.min(x.maxHp,x.hp+18)};if(action.kind==='guard')return {...x,shield:x.shield+20};if(action.kind==='hex')return {...x,ap:Math.max(0,x.ap-1)};const damage=16,absorbed=Math.min(x.shield,damage);return {...x,shield:x.shield-absorbed,hp:Math.max(0,x.hp-(damage-absorbed))};});}

export function chooseTacticalEngineAction(session:BattleSession,actorId:string,seed:number):TacticalActionInput|null {
  const actor=session.units.find(unit=>unit.id===actorId);
  if(!actor||actor.hp<=0)return null;
  const allies=session.units.filter(unit=>unit.side===actor.side&&unit.hp>0);
  const enemies=session.units.filter(unit=>unit.side!==actor.side&&unit.hp>0);
  if(!enemies.length)return null;
  if(actor.mp>=actor.maxMp){const targets=validTacticalTargets(session,actorId,'special');const target=lowest(enemies.filter(unit=>targets.includes(unit.id)));if(target)return{actorId,actionId:'special',targetId:target.id};}
  const patient=lowest(allies);
  if(patient&&patient.hp/patient.maxHp<=.4&&actor.ap>=2&&validTacticalTargets(session,actorId,'support').includes(patient.id))return{actorId,actionId:'support',targetId:patient.id};
  const attackTargets=validTacticalTargets(session,actorId,'attack');
  const exposed=enemies.filter(unit=>attackTargets.includes(unit.id));
  if(exposed.length){const sorted=exposed.slice().sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp)||a.id.localeCompare(b.id));const minRatio=sorted[0].hp/sorted[0].maxHp;const tied=sorted.filter(unit=>unit.hp/unit.maxHp===minRatio);const target=tied[Math.abs(Math.floor(seed))%tied.length];return{actorId,actionId:'attack',targetId:target.id};}
  const skillTargets=validTacticalTargets(session,actorId,'skill');const target=lowest(enemies.filter(unit=>skillTargets.includes(unit.id)));return target?{actorId,actionId:'skill',targetId:target.id}:null;
}
