import type {BattlePosition,BattleSession,TacticalUnit} from './tactical-battle';
import {isBattleFinished} from './tactical-battle';
import {availableTacticalActions,validTacticalTargets,type TacticalActionId} from './tactical-actions';
import {nextTacticalActor} from './tactical-engine';

export type TacticalUnitView={id:string;hp:number;maxHp:number;shield:number;position:BattlePosition;alive:boolean;ap:number;maxAp:number;mp:number;maxMp:number;active:boolean;statuses:string[]};
const view=(u:TacticalUnit,activeActorId:string|null):TacticalUnitView=>({id:u.id,hp:u.hp,maxHp:u.maxHp,shield:u.shield,position:u.position,alive:u.hp>0,ap:u.ap,maxAp:u.maxAp,mp:u.mp,maxMp:u.maxMp,active:u.id===activeActorId,statuses:(u.statuses??[]).map(status=>`${status.id}:${status.turns}`)});
export function battleSpeedLabel(speed:1|2){return `${speed}x`;}
export function formationSlotLabel(position:BattlePosition){return position.toUpperCase();}
export function buildTacticalBattleView(session:BattleSession,auto:boolean,speed:1|2,selectedAction:TacticalActionId|null=null){const activeActorId=nextTacticalActor(session);const active=session.units.find(u=>u.id===activeActorId)??null;const units=session.units.map(u=>view(u,activeActorId));return {round:session.round,units,allies:units.filter(u=>session.units.find(raw=>raw.id===u.id)?.side==='ally'),enemies:units.filter(u=>session.units.find(raw=>raw.id===u.id)?.side==='enemy'),timeline:session.timeline.slice(),activeActorId,actions:active?availableTacticalActions(active):[],validTargetIds:activeActorId&&selectedAction?validTacticalTargets(session,activeActorId,selectedAction):[],result:isBattleFinished(session),autoLabel:auto?'AUTO ON':'AUTO OFF',speedLabel:battleSpeedLabel(speed)};}
