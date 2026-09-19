import type {AdventureEnemyState} from './enemy-ai';
import type {Vec3} from './types';

export const LOCK_ON_MAX_DISTANCE=28;
export const LOCK_ON_BREAK_DISTANCE=34;
const LOCK_FRONT_HALF_ANGLE=Math.PI*100/180;

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const distance2=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);
const normalizeAngle=(angle:number)=>{
  let value=angle;
  while(value>Math.PI)value-=Math.PI*2;
  while(value<-Math.PI)value+=Math.PI*2;
  return value;
};

export function yawToTarget(origin:Vec3,target:Vec3){
  return Math.atan2(target.x-origin.x,-(target.z-origin.z));
}

export function targetCandidates(
  enemies:readonly AdventureEnemyState[],
  player:Vec3,
  cameraYaw:number,
  maxDistance=LOCK_ON_MAX_DISTANCE,
){
  return enemies
    .filter(enemy=>enemy.hp>0&&enemy.mode!=='defeated')
    .map(enemy=>{
      const distance=distance2(player,enemy.position);
      const targetYaw=yawToTarget(player,enemy.position);
      const angle=Math.abs(normalizeAngle(targetYaw-cameraYaw));
      return {enemy,distance,angle,targetYaw};
    })
    .filter(entry=>entry.distance<=maxDistance&&entry.angle<=LOCK_FRONT_HALF_ANGLE)
    .sort((a,b)=>(a.distance+a.angle*6)-(b.distance+b.angle*6));
}

export function selectLockOnTarget(
  enemies:readonly AdventureEnemyState[],
  player:Vec3,
  cameraYaw:number,
){
  return targetCandidates(enemies,player,cameraYaw)[0]?.enemy??null;
}

export function cycleLockOnTarget(
  enemies:readonly AdventureEnemyState[],
  player:Vec3,
  cameraYaw:number,
  currentId:string|null,
){
  const candidates=targetCandidates(enemies,player,cameraYaw)
    .sort((a,b)=>normalizeAngle(a.targetYaw-cameraYaw)-normalizeAngle(b.targetYaw-cameraYaw));
  if(!candidates.length)return null;
  const index=candidates.findIndex(entry=>entry.enemy.id===currentId);
  return candidates[(index+1+candidates.length)%candidates.length]?.enemy??null;
}

export function lockedTargetStillValid(
  enemy:AdventureEnemyState|undefined,
  player:Vec3,
){
  return Boolean(enemy&&enemy.hp>0&&enemy.mode!=='defeated'&&distance2(player,enemy.position)<=LOCK_ON_BREAK_DISTANCE);
}

export function smoothLockOnYaw(
  currentYaw:number,
  player:Vec3,
  target:Vec3,
  dtRaw:number,
){
  const dt=clamp(finite(dtRaw),0,.05);
  const desired=yawToTarget(player,target);
  const delta=normalizeAngle(desired-currentYaw);
  const maxStep=5.8*dt;
  return currentYaw+clamp(delta,-maxStep,maxStep);
}
