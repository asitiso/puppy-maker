import type {FieldHazardState} from './environment-combat';
import {STARTING_FIELD,startingFieldHeight} from './starting-field';
import type {Vec3} from './types';

export const DAWNREACH_HERD={
  id:'dawnreach-herd' as const,
  label:'새벽사슴 무리',
  calmSpeed:1.25,
  fleeSpeed:5.8,
  playerAlertRadius:10,
  fireAlertRadius:13,
  witnessRadius:19,
};

export const WILDLIFE_DISCOVERY_TRAIL={
  targetDiscoveryId:'hollow-cave' as const,
  origin:{x:54,z:17},
  triggerRadius:10,
  playerWitnessRadius:24,
  duration:18,
};

const herdPath=[
  {x:38,z:44},
  {x:58,z:18},
  {x:40,z:-8},
  {x:14,z:-22},
  {x:-9,z:-4},
  {x:7,z:27},
] as const;

export type WildlifeBehavior='grazing'|'moving'|'flee-player'|'flee-fire';

export type DawnreachHerdState={
  center:Vec3;
  targetIndex:number;
  facingYaw:number;
  behavior:WildlifeBehavior;
  alarmClock:number;
};

export type WildlifeVisual={
  id:typeof DAWNREACH_HERD.id;
  label:string;
  center:Vec3;
  facingYaw:number;
  behavior:WildlifeBehavior;
  members:readonly Vec3[];
};

export type WildlifeTrailVisual={
  targetDiscoveryId:typeof WILDLIFE_DISCOVERY_TRAIL.targetDiscoveryId;
  points:readonly Vec3[];
  secondsRemaining:number;
};

function point(x:number,z:number):Vec3{
  return {x,y:startingFieldHeight(x,z),z};
}

function distance(a:Vec3,b:Vec3){
  return Math.hypot(a.x-b.x,a.z-b.z);
}

function normalize(x:number,z:number){
  const length=Math.max(.0001,Math.hypot(x,z));
  return {x:x/length,z:z/length};
}

function clampToField(x:number,z:number){
  const margin=8;
  const limit=STARTING_FIELD.halfSize-margin;
  return {
    x:Math.max(-limit,Math.min(limit,x)),
    z:Math.max(-limit,Math.min(limit,z)),
  };
}

function closestBurningHazard(
  center:Vec3,
  hazards:readonly FieldHazardState[],
){
  return hazards
    .filter(item=>item.burning&&!item.spent)
    .map(item=>({item,distance:distance(center,item.position)}))
    .sort((a,b)=>a.distance-b.distance)[0]??null;
}

export function createDawnreachHerdState():DawnreachHerdState{
  const start=herdPath[0];
  const next=herdPath[1];
  return {
    center:point(start.x,start.z),
    targetIndex:1,
    facingYaw:Math.atan2(next.x-start.x,next.z-start.z),
    behavior:'grazing',
    alarmClock:0,
  };
}

export function stepDawnreachHerd(
  state:DawnreachHerdState,
  player:Vec3,
  hazards:readonly FieldHazardState[],
  dtRaw:number,
):DawnreachHerdState{
  const dt=Math.max(0,Math.min(.1,dtRaw));
  if(dt<=0)return state;

  const fire=closestBurningHazard(state.center,hazards);
  const playerDistance=distance(state.center,player);
  const fireThreat=fire&&fire.distance<=DAWNREACH_HERD.fireAlertRadius+fire.item.radius;
  const playerThreat=playerDistance<=DAWNREACH_HERD.playerAlertRadius;
  let behavior:WildlifeBehavior=state.behavior;
  let alarmClock=Math.max(0,state.alarmClock-dt);
  let direction:{x:number;z:number}|null=null;
  let speed=DAWNREACH_HERD.calmSpeed;

  if(fireThreat){
    direction=normalize(
      state.center.x-fire!.item.position.x,
      state.center.z-fire!.item.position.z,
    );
    behavior='flee-fire';
    alarmClock=2.8;
    speed=DAWNREACH_HERD.fleeSpeed;
  }else if(playerThreat){
    direction=normalize(
      state.center.x-player.x,
      state.center.z-player.z,
    );
    behavior='flee-player';
    alarmClock=2.1;
    speed=DAWNREACH_HERD.fleeSpeed;
  }else if(alarmClock>0&&(
    state.behavior==='flee-player'||state.behavior==='flee-fire'
  )){
    const forward={x:Math.sin(state.facingYaw),z:Math.cos(state.facingYaw)};
    direction=forward;
    behavior=state.behavior;
    speed=DAWNREACH_HERD.fleeSpeed*.72;
  }else{
    const target=herdPath[state.targetIndex];
    const dx=target.x-state.center.x;
    const dz=target.z-state.center.z;
    const targetDistance=Math.hypot(dx,dz);
    if(targetDistance<1.6){
      return {
        ...state,
        center:point(state.center.x,state.center.z),
        targetIndex:(state.targetIndex+1)%herdPath.length,
        behavior:'grazing',
        alarmClock:0,
      };
    }
    direction=normalize(dx,dz);
    behavior='moving';
  }

  const moved=clampToField(
    state.center.x+direction.x*speed*dt,
    state.center.z+direction.z*speed*dt,
  );
  return {
    center:point(moved.x,moved.z),
    targetIndex:state.targetIndex,
    facingYaw:Math.atan2(direction.x,direction.z),
    behavior,
    alarmClock,
  };
}

export function playerNearDawnreachHerd(
  player:Vec3,
  herd:DawnreachHerdState,
  radius=DAWNREACH_HERD.witnessRadius,
):boolean{
  return distance(player,herd.center)<=radius;
}

export function shouldWitnessDawnreachHerd(
  player:Vec3,
  herd:DawnreachHerdState,
  witnessed:boolean,
):boolean{
  return !witnessed&&playerNearDawnreachHerd(player,herd);
}

export function shouldRevealWildlifeDiscoveryTrail(
  player:Vec3,
  herd:DawnreachHerdState,
  discovered:ReadonlySet<string>,
):boolean{
  if(discovered.has(WILDLIFE_DISCOVERY_TRAIL.targetDiscoveryId))return false;
  if(herd.behavior==='flee-fire')return false;
  const origin=point(WILDLIFE_DISCOVERY_TRAIL.origin.x,WILDLIFE_DISCOVERY_TRAIL.origin.z);
  return (
    distance(herd.center,origin)<=WILDLIFE_DISCOVERY_TRAIL.triggerRadius&&
    distance(player,herd.center)<=WILDLIFE_DISCOVERY_TRAIL.playerWitnessRadius
  );
}

export function dawnreachWildlifeTrailVisual(secondsRemaining:number):WildlifeTrailVisual|null{
  if(secondsRemaining<=0)return null;
  const target=STARTING_FIELD.discoveries.find(
    item=>item.id===WILDLIFE_DISCOVERY_TRAIL.targetDiscoveryId,
  );
  if(!target)return null;
  const start=point(WILDLIFE_DISCOVERY_TRAIL.origin.x,WILDLIFE_DISCOVERY_TRAIL.origin.z);
  const dx=target.position.x-start.x;
  const dz=target.position.z-start.z;
  const length=Math.max(.001,Math.hypot(dx,dz));
  const right={x:dz/length,z:-dx/length};
  const points=Array.from({length:7},(_,index)=>{
    const t=(index+1)/8;
    const side=(index%2===0?-1:1)*.34;
    const x=start.x+dx*t+right.x*side;
    const z=start.z+dz*t+right.z*side;
    return point(x,z);
  });
  return {
    targetDiscoveryId:WILDLIFE_DISCOVERY_TRAIL.targetDiscoveryId,
    points,
    secondsRemaining,
  };
}

export function dawnreachHerdVisual(state:DawnreachHerdState):WildlifeVisual{
  const forward={x:Math.sin(state.facingYaw),z:Math.cos(state.facingYaw)};
  const right={x:forward.z,z:-forward.x};
  const offsets=[
    {forward:0,right:0},
    {forward:-1.8,right:1.7},
    {forward:-2.4,right:-1.45},
    {forward:-4.1,right:.25},
  ] as const;
  const members=offsets.map(offset=>{
    const x=state.center.x+forward.x*offset.forward+right.x*offset.right;
    const z=state.center.z+forward.z*offset.forward+right.z*offset.right;
    return point(x,z);
  });
  return {
    id:DAWNREACH_HERD.id,
    label:DAWNREACH_HERD.label,
    center:state.center,
    facingYaw:state.facingYaw,
    behavior:state.behavior,
    members,
  };
}
