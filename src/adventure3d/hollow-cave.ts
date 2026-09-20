import {STARTING_FIELD,startingFieldHeight} from './starting-field';
import type {Vec3} from './types';

export const HOLLOW_CAVE={
  discoveryId:'hollow-cave' as const,
  label:'바람숨 동굴',
  entrance:{x:63,z:26},
  entranceRadius:4.5,
  chamberCenter:{x:-88,z:88},
  chamberRadius:9.5,
  exitRadius:2.6,
  resonatorRadius:5.4,
  shortcutRadius:2.8,
  outsideShortcut:{x:12,z:61},
};

const resonatorPlan=[
  {x:-93,z:86},
  {x:-88,z:81},
  {x:-83,z:86},
] as const;

export type HollowCaveRuntimeState={
  inside:boolean;
  resonatorMask:number;
  shortcutOpen:boolean;
  pulseFlash:number;
  lastResonator:number|null;
};

export type HollowCaveVisual={
  active:boolean;
  label:string;
  center:Vec3;
  exit:Vec3;
  shortcut:Vec3;
  shortcutOpen:boolean;
  resonators:readonly {position:Vec3;active:boolean}[];
  pulseFlash:number;
  lastResonator:number|null;
  nearbyExit:boolean;
  nearbyShortcut:boolean;
};

const allResonatorsMask=(1<<resonatorPlan.length)-1;

function point(x:number,z:number):Vec3{
  return {x,y:startingFieldHeight(x,z),z};
}

function planarDistance(a:Vec3,b:Vec3){
  return Math.hypot(a.x-b.x,a.z-b.z);
}

function forwardFromYaw(yaw:number){
  return {x:Math.sin(yaw),z:-Math.cos(yaw)};
}

function inFront(origin:Vec3,target:Vec3,yaw:number,range:number,halfAngleDeg=72){
  const dx=target.x-origin.x;
  const dz=target.z-origin.z;
  const distance=Math.hypot(dx,dz);
  if(distance>range)return false;
  if(distance<.001)return true;
  const forward=forwardFromYaw(yaw);
  return forward.x*(dx/distance)+forward.z*(dz/distance)>=Math.cos(halfAngleDeg*Math.PI/180);
}

export function hollowCaveEntrancePosition(){
  return point(HOLLOW_CAVE.entrance.x,HOLLOW_CAVE.entrance.z);
}

export function hollowCaveOutsideShortcutPosition(){
  return point(HOLLOW_CAVE.outsideShortcut.x,HOLLOW_CAVE.outsideShortcut.z);
}

export function hollowCaveInsideEntryPosition(){
  return point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z+6.8);
}

export function hollowCaveInsideShortcutSpawn(){
  return point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z-5.7);
}

export function createHollowCaveRuntimeState(shortcutOpen=false):HollowCaveRuntimeState{
  return {
    inside:false,
    resonatorMask:shortcutOpen?allResonatorsMask:0,
    shortcutOpen,
    pulseFlash:0,
    lastResonator:null,
  };
}

export function enterHollowCave(
  state:HollowCaveRuntimeState,
  viaShortcut=false,
):HollowCaveRuntimeState{
  return {...state,inside:true,lastResonator:null,pulseFlash:0};
}

export function leaveHollowCave(state:HollowCaveRuntimeState):HollowCaveRuntimeState{
  return {...state,inside:false,lastResonator:null,pulseFlash:0};
}

export function stepHollowCaveRuntime(
  state:HollowCaveRuntimeState,
  dtRaw:number,
):HollowCaveRuntimeState{
  const dt=Math.max(0,Math.min(.1,dtRaw));
  if(dt<=0||state.pulseFlash<=0)return state;
  return {...state,pulseFlash:Math.max(0,state.pulseFlash-dt)};
}

export function playerNearHollowCaveEntrance(player:Vec3,range=HOLLOW_CAVE.entranceRadius){
  return planarDistance(player,hollowCaveEntrancePosition())<=range;
}

export function playerNearHollowCaveOutsideShortcut(
  player:Vec3,
  shortcutOpen:boolean,
  range=HOLLOW_CAVE.shortcutRadius,
){
  return shortcutOpen&&planarDistance(player,hollowCaveOutsideShortcutPosition())<=range;
}

function caveExitPosition(){
  return point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z+8);
}

function caveShortcutPosition(){
  return point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z-7.4);
}

export function playerNearHollowCaveExit(player:Vec3,state:HollowCaveRuntimeState){
  return state.inside&&planarDistance(player,caveExitPosition())<=HOLLOW_CAVE.exitRadius;
}

export function playerNearHollowCaveShortcut(player:Vec3,state:HollowCaveRuntimeState){
  return state.inside&&state.shortcutOpen&&planarDistance(player,caveShortcutPosition())<=HOLLOW_CAVE.shortcutRadius;
}

export function constrainHollowCavePlayer(position:Vec3):Vec3{
  const center=point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z);
  const dx=position.x-center.x;
  const dz=position.z-center.z;
  const distance=Math.hypot(dx,dz);
  if(distance<=HOLLOW_CAVE.chamberRadius)return position;
  const scale=HOLLOW_CAVE.chamberRadius/Math.max(.001,distance);
  const x=center.x+dx*scale;
  const z=center.z+dz*scale;
  return {x,y:startingFieldHeight(x,z),z};
}

export function castHollowCaveWindPulse(
  state:HollowCaveRuntimeState,
  player:Vec3,
  facingYaw:number,
):{state:HollowCaveRuntimeState;affected:boolean;openedShortcut:boolean;activatedCount:number}{
  if(!state.inside||state.shortcutOpen){
    return {
      state,
      affected:false,
      openedShortcut:false,
      activatedCount:countActiveHollowCaveResonators(state),
    };
  }

  let targetIndex=-1;
  let targetDistance=Number.POSITIVE_INFINITY;
  for(const [index,resonator] of resonatorPlan.entries()){
    if((state.resonatorMask&(1<<index))!==0)continue;
    const target=point(resonator.x,resonator.z);
    const distance=planarDistance(player,target);
    if(
      distance<targetDistance&&
      inFront(player,target,facingYaw,HOLLOW_CAVE.resonatorRadius)
    ){
      targetIndex=index;
      targetDistance=distance;
    }
  }
  if(targetIndex<0){
    return {
      state,
      affected:false,
      openedShortcut:false,
      activatedCount:countActiveHollowCaveResonators(state),
    };
  }

  const resonatorMask=state.resonatorMask|(1<<targetIndex);
  const shortcutOpen=resonatorMask===allResonatorsMask;
  const next:HollowCaveRuntimeState={
    ...state,
    resonatorMask,
    shortcutOpen,
    pulseFlash:.48,
    lastResonator:targetIndex,
  };
  return {
    state:next,
    affected:true,
    openedShortcut:shortcutOpen&&!state.shortcutOpen,
    activatedCount:countActiveHollowCaveResonators(next),
  };
}

export function countActiveHollowCaveResonators(state:HollowCaveRuntimeState){
  let count=0;
  for(let index=0;index<resonatorPlan.length;index++){
    if((state.resonatorMask&(1<<index))!==0)count++;
  }
  return count;
}

export function hollowCaveVisual(
  state:HollowCaveRuntimeState,
  player:Vec3,
):HollowCaveVisual|null{
  if(!state.inside)return null;
  return {
    active:true,
    label:HOLLOW_CAVE.label,
    center:point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z),
    exit:caveExitPosition(),
    shortcut:caveShortcutPosition(),
    shortcutOpen:state.shortcutOpen,
    resonators:resonatorPlan.map((item,index)=>({
      position:point(item.x,item.z),
      active:(state.resonatorMask&(1<<index))!==0,
    })),
    pulseFlash:state.pulseFlash,
    lastResonator:state.lastResonator,
    nearbyExit:playerNearHollowCaveExit(player,state),
    nearbyShortcut:playerNearHollowCaveShortcut(player,state),
  };
}

export function hollowCaveReturnFromEntrance(){
  const entrance=hollowCaveEntrancePosition();
  return {
    x:entrance.x-4,
    y:startingFieldHeight(entrance.x-4,entrance.z),
    z:entrance.z,
  };
}

export function hollowCaveReturnFromShortcut(){
  const exit=hollowCaveOutsideShortcutPosition();
  return {
    x:exit.x,
    y:startingFieldHeight(exit.x,exit.z-4),
    z:exit.z-4,
  };
}

export function isHollowCavePocketPosition(position:Vec3){
  return planarDistance(position,point(HOLLOW_CAVE.chamberCenter.x,HOLLOW_CAVE.chamberCenter.z))
    <=HOLLOW_CAVE.chamberRadius+1;
}

export function hollowCaveFieldBoundsRemainValid(){
  return Math.abs(HOLLOW_CAVE.chamberCenter.x)+HOLLOW_CAVE.chamberRadius<=STARTING_FIELD.halfSize&&
    Math.abs(HOLLOW_CAVE.chamberCenter.z)+HOLLOW_CAVE.chamberRadius<=STARTING_FIELD.halfSize;
}
