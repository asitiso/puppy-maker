import {applyEnemyDamage,type AdventureEnemyState,type EnemyAvoidanceZone} from './enemy-ai';
import {applyPlayerDamage,type PlayerCombatState} from './combat-system';
import type {EnvironmentAbilityId} from './environment-system';
import type {Vec3} from './types';

export type FieldHazardMaterial='dryGrass';
export type FieldHazardState={
  id:string;
  material:FieldHazardMaterial;
  position:Vec3;
  radius:number;
  burning:boolean;
  spent:boolean;
  burnRemaining:number;
  pulseClock:number;
};

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const distance2=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);
const forwardFromYaw=(yaw:number)=>({x:Math.sin(yaw),z:-Math.cos(yaw)});

function inFront(origin:Vec3,target:Vec3,yaw:number,range:number,halfAngleDeg=76){
  const dx=target.x-origin.x,dz=target.z-origin.z;
  const distance=Math.hypot(dx,dz);
  if(distance>.001&&distance<=range){
    const forward=forwardFromYaw(yaw);
    return forward.x*(dx/distance)+forward.z*(dz/distance)>=Math.cos(halfAngleDeg*Math.PI/180);
  }
  return distance<=range;
}

export function createDryGrassPatch(id:string,position:Vec3,radius=3.8):FieldHazardState{
  return {id,material:'dryGrass',position:{...position},radius,burning:false,spent:false,burnRemaining:0,pulseClock:0};
}

export function igniteFieldHazard(
  hazards:readonly FieldHazardState[],
  player:Vec3,
  facingYaw:number,
):{hazards:FieldHazardState[];affectedId:string|null}{
  const candidate=hazards
    .filter(item=>!item.spent&&!item.burning&&inFront(player,item.position,facingYaw,7.5))
    .sort((a,b)=>distance2(player,a.position)-distance2(player,b.position))[0];
  if(!candidate)return {hazards:[...hazards],affectedId:null};
  return {
    hazards:hazards.map(item=>item.id===candidate.id?{...item,burning:true,burnRemaining:8,pulseClock:0}:item),
    affectedId:candidate.id,
  };
}

export function spreadFieldFireWithWind(
  hazards:readonly FieldHazardState[],
  player:Vec3,
  facingYaw:number,
):{hazards:FieldHazardState[];sourceId:string|null;spreadToId:string|null}{
  const source=hazards
    .filter(item=>item.burning&&!item.spent&&inFront(player,item.position,facingYaw,9))
    .sort((a,b)=>distance2(player,a.position)-distance2(player,b.position))[0];
  if(!source)return {hazards:[...hazards],sourceId:null,spreadToId:null};

  const wind=forwardFromYaw(facingYaw);
  const target=hazards
    .filter(item=>item.id!==source.id&&!item.burning&&!item.spent)
    .map(item=>{
      const dx=item.position.x-source.position.x,dz=item.position.z-source.position.z;
      const distance=Math.hypot(dx,dz);
      const dot=distance>.001?wind.x*(dx/distance)+wind.z*(dz/distance):-1;
      return {item,distance,dot};
    })
    .filter(entry=>entry.distance<=11&&entry.dot>=.42)
    .sort((a,b)=>b.dot-a.dot||a.distance-b.distance)[0]?.item??null;

  return {
    hazards:hazards.map(item=>{
      if(item.id===source.id)return {...item,burnRemaining:Math.min(10,item.burnRemaining+1.5)};
      if(target&&item.id===target.id)return {...item,burning:true,burnRemaining:7,pulseClock:0};
      return item;
    }),
    sourceId:source.id,
    spreadToId:target?.id??null,
  };
}

export function castFieldEnvironmentAbility(
  hazards:readonly FieldHazardState[],
  ability:EnvironmentAbilityId,
  player:Vec3,
  facingYaw:number,
){
  if(ability==='emberSpark'){
    const result=igniteFieldHazard(hazards,player,facingYaw);
    return {hazards:result.hazards,affected:Boolean(result.affectedId),spread:false};
  }
  const result=spreadFieldFireWithWind(hazards,player,facingYaw);
  return {hazards:result.hazards,affected:Boolean(result.sourceId),spread:Boolean(result.spreadToId)};
}

export function stepFieldHazards(
  hazards:readonly FieldHazardState[],
  dtRaw:number,
):{hazards:FieldHazardState[];damagePulse:boolean}{
  const dt=clamp(finite(dtRaw),0,.05);
  let damagePulse=false;
  const next=hazards.map(item=>{
    if(!item.burning||item.spent)return item;
    const burnRemaining=Math.max(0,item.burnRemaining-dt);
    const pulseClock=item.pulseClock+dt;
    if(pulseClock>=.7)damagePulse=true;
    if(burnRemaining<=0)return {...item,burning:false,spent:true,burnRemaining:0,pulseClock:0};
    return {...item,burnRemaining,pulseClock:pulseClock>=.7?pulseClock-.7:pulseClock};
  });
  return {hazards:next,damagePulse};
}

export function burningHazardAvoidanceZones(
  hazards:readonly FieldHazardState[],
):EnemyAvoidanceZone[]{
  return hazards
    .filter(item=>item.burning&&!item.spent)
    .map(item=>({position:item.position,radius:item.radius,weight:2.4}));
}

export function applyBurningHazardsToPlayer(
  combat:PlayerCombatState,
  player:Vec3,
  hazards:readonly FieldHazardState[],
):{state:PlayerCombatState;damaged:boolean}{
  const burning=hazards.find(item=>item.burning&&!item.spent&&distance2(player,item.position)<=item.radius);
  if(!burning)return {state:combat,damaged:false};
  return applyPlayerDamage(combat,6);
}

export function applyBurningHazardsToEnemies(
  enemies:readonly AdventureEnemyState[],
  hazards:readonly FieldHazardState[],
  pulseSerial:number,
):{enemies:AdventureEnemyState[];damagedIds:string[]}{
  const burning=hazards.filter(item=>item.burning&&!item.spent);
  if(!burning.length)return {enemies:[...enemies],damagedIds:[]};
  const damagedIds:string[]=[];
  const next=enemies.map(enemy=>{
    if(enemy.hp<=0)return enemy;
    const hazard=burning.find(item=>distance2(enemy.position,item.position)<=item.radius);
    if(!hazard)return enemy;
    const hit=applyEnemyDamage(enemy,8,pulseSerial);
    if(!hit.damaged)return enemy;
    damagedIds.push(enemy.id);
    const dx=enemy.position.x-hazard.position.x,dz=enemy.position.z-hazard.position.z;
    const length=Math.max(.001,Math.hypot(dx,dz));
    return {
      ...hit.enemy,
      position:{
        x:enemy.position.x+dx/length*.9,
        y:enemy.position.y,
        z:enemy.position.z+dz/length*.9,
      },
    };
  });
  return {enemies:next,damagedIds};
}

export function playerNearFieldHazard(hazards:readonly FieldHazardState[],player:Vec3,range=12){
  return hazards.some(item=>!item.spent&&distance2(item.position,player)<=range);
}
