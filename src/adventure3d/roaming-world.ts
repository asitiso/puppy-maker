import {startingFieldHeight} from './starting-field';
import type {DawnreachWorldEventOutcome} from './world-events';
import type {Vec3} from './types';

export const WANDERING_CARAVAN={
  id:'wandering-caravan' as const,
  label:'들판 행상인',
  speed:2.35,
  witnessRadius:16,
  interactionRadius:5.5,
};

const caravanPath=[
  {x:-12,z:45},
  {x:18,z:37},
  {x:36,z:13},
  {x:28,z:-17},
  {x:2,z:-35},
  {x:-29,z:-23},
] as const;

export type WanderingCaravanState={
  position:Vec3;
  targetIndex:number;
  facingYaw:number;
};

export type RoamingWorldPresenceVisual={
  id:typeof WANDERING_CARAVAN.id;
  label:string;
  position:Vec3;
  facingYaw:number;
  familiar:boolean;
  nearby:boolean;
};

function point(x:number,z:number):Vec3{
  return {x,y:startingFieldHeight(x,z),z};
}

export function createWanderingCaravanState():WanderingCaravanState{
  const start=caravanPath[0];
  const next=caravanPath[1];
  return {
    position:point(start.x,start.z),
    targetIndex:1,
    facingYaw:Math.atan2(next.x-start.x,next.z-start.z),
  };
}

export function stepWanderingCaravan(
  state:WanderingCaravanState,
  dt:number,
  paused=false,
):WanderingCaravanState{
  if(paused||dt<=0)return state;
  let position={...state.position};
  let targetIndex=state.targetIndex;
  let facingYaw=state.facingYaw;
  let remaining=WANDERING_CARAVAN.speed*Math.min(.1,dt);
  let guard=0;

  while(remaining>0&&guard<caravanPath.length+1){
    guard+=1;
    const target=caravanPath[targetIndex];
    const dx=target.x-position.x;
    const dz=target.z-position.z;
    const distance=Math.hypot(dx,dz);
    if(distance<.0001){
      targetIndex=(targetIndex+1)%caravanPath.length;
      continue;
    }
    facingYaw=Math.atan2(dx,dz);
    if(distance<=remaining){
      position=point(target.x,target.z);
      remaining-=distance;
      targetIndex=(targetIndex+1)%caravanPath.length;
      continue;
    }
    const scale=remaining/distance;
    const x=position.x+dx*scale;
    const z=position.z+dz*scale;
    position=point(x,z);
    remaining=0;
  }

  return {position,targetIndex,facingYaw};
}

export function playerNearWanderingCaravan(
  player:Vec3,
  state:WanderingCaravanState,
  radius=WANDERING_CARAVAN.interactionRadius,
):boolean{
  return Math.hypot(player.x-state.position.x,player.z-state.position.z)<=radius;
}

export function shouldWitnessWanderingCaravan(
  player:Vec3,
  state:WanderingCaravanState,
  alreadyWitnessed:boolean,
):boolean{
  return !alreadyWitnessed&&playerNearWanderingCaravan(player,state,WANDERING_CARAVAN.witnessRadius);
}

export function wanderingCaravanVisual(
  state:WanderingCaravanState,
  familiar:boolean,
  nearby:boolean,
):RoamingWorldPresenceVisual{
  return {
    id:WANDERING_CARAVAN.id,
    label:familiar?'아는 행상인':WANDERING_CARAVAN.label,
    position:state.position,
    facingYaw:state.facingYaw,
    familiar,
    nearby,
  };
}

export function wanderingCaravanMessage(
  familiar:boolean,
  roadsideOutcome:DawnreachWorldEventOutcome|undefined,
):string{
  if(familiar)return '행상인: “또 만났네요. 저는 계속 들판 길을 돌고 있어요. 멀리서 짐승 방울 소리가 들리면 제 쪽일 겁니다.”';
  if(roadsideOutcome==='rescued')return '행상인: “서쪽 길목이 다시 조용해졌더군요. 덕분에 길이 한결 나아졌어요. 오래된 돌다리 아래에는 바람이 이상하게 돌아요.”';
  if(roadsideOutcome==='passed')return '행상인: “서쪽 길목에 버려진 짐이 늘었어요. 요 며칠은 오래된 돌다리 쪽으로 돌아가는 편이 안전하겠네요.”';
  return '행상인: “정해진 길만 보지 마세요. 오래된 돌다리 아래에서 바람이 거꾸로 부는 날이 있답니다.”';
}
