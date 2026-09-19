import type {Vec3} from './types';

export type EnvironmentAbilityId='windPulse'|'emberSpark';

export type RuinPuzzleState={
  stonePosition:Vec3;
  brazierLit:boolean;
  westPlateActive:boolean;
  eastPlateActive:boolean;
  solved:boolean;
  rewardClaimed:boolean;
  windPulseFlash:number;
  emberFlash:number;
};

export type RuinPuzzleLayout={
  center:Vec3;
  westPlate:Vec3;
  eastPlate:Vec3;
  brazier:Vec3;
  stoneStart:Vec3;
  reward:Vec3;
};

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const distance2=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);

function forwardFromYaw(yaw:number){return {x:Math.sin(yaw),z:-Math.cos(yaw)};}

function inFront(origin:Vec3,target:Vec3,yaw:number,range:number,halfAngleDeg=70){
  const dx=target.x-origin.x,dz=target.z-origin.z;
  const distance=Math.hypot(dx,dz);
  if(distance>.001&&distance<=range){
    const f=forwardFromYaw(yaw);
    return f.x*(dx/distance)+f.z*(dz/distance)>=Math.cos(halfAngleDeg*Math.PI/180);
  }
  return distance<=range;
}

export function createRuinPuzzleState(layout:RuinPuzzleLayout):RuinPuzzleState{
  return {
    stonePosition:{...layout.stoneStart},
    brazierLit:false,
    westPlateActive:false,
    eastPlateActive:false,
    solved:false,
    rewardClaimed:false,
    windPulseFlash:0,
    emberFlash:0,
  };
}

export function stepRuinPuzzle(
  state:RuinPuzzleState,
  layout:RuinPuzzleLayout,
  player:Vec3,
  dtRaw:number,
):RuinPuzzleState{
  const dt=clamp(finite(dtRaw),0,.05);
  const playerOnWest=distance2(player,layout.westPlate)<=1.65;
  const playerOnEast=distance2(player,layout.eastPlate)<=1.65;
  const stoneOnWest=distance2(state.stonePosition,layout.westPlate)<=1.55;
  const stoneOnEast=distance2(state.stonePosition,layout.eastPlate)<=1.55;
  const westPlateActive=state.brazierLit||playerOnWest||stoneOnWest;
  const eastPlateActive=playerOnEast||stoneOnEast;
  const solved=state.solved||(westPlateActive&&eastPlateActive);
  return {
    ...state,
    westPlateActive,
    eastPlateActive,
    solved,
    windPulseFlash:Math.max(0,state.windPulseFlash-dt),
    emberFlash:Math.max(0,state.emberFlash-dt),
  };
}

export function pushRuinStone(
  state:RuinPuzzleState,
  layout:RuinPuzzleLayout,
  player:Vec3,
  facingYaw:number,
  terrainHeight:(x:number,z:number)=>number,
):{state:RuinPuzzleState;moved:boolean}{
  if(distance2(player,state.stonePosition)>2.35)return {state,moved:false};
  const f=forwardFromYaw(facingYaw);
  const x=clamp(state.stonePosition.x+f.x*1.35,layout.center.x-12,layout.center.x+12);
  const z=clamp(state.stonePosition.z+f.z*1.35,layout.center.z-10,layout.center.z+10);
  return {
    state:{...state,stonePosition:{x,y:terrainHeight(x,z),z}},
    moved:true,
  };
}

export function castRuinAbility(
  state:RuinPuzzleState,
  layout:RuinPuzzleLayout,
  ability:EnvironmentAbilityId,
  player:Vec3,
  facingYaw:number,
  terrainHeight:(x:number,z:number)=>number,
):{state:RuinPuzzleState;affected:boolean}{
  if(ability==='emberSpark'){
    if(!inFront(player,layout.brazier,facingYaw,6.5,78))return {state,affected:false};
    return {state:{...state,brazierLit:true,emberFlash:.42},affected:true};
  }

  if(!inFront(player,state.stonePosition,facingYaw,7.5,72))return {state,affected:false};
  const dx=state.stonePosition.x-player.x,dz=state.stonePosition.z-player.z;
  const length=Math.max(.001,Math.hypot(dx,dz));
  const x=clamp(state.stonePosition.x+dx/length*4.2,layout.center.x-12,layout.center.x+12);
  const z=clamp(state.stonePosition.z+dz/length*4.2,layout.center.z-10,layout.center.z+10);
  return {
    state:{...state,stonePosition:{x,y:terrainHeight(x,z),z},windPulseFlash:.34},
    affected:true,
  };
}

export function canClaimRuinReward(state:RuinPuzzleState,layout:RuinPuzzleLayout,player:Vec3){
  return state.solved&&!state.rewardClaimed&&distance2(player,layout.reward)<=2.5;
}

export function claimRuinReward(state:RuinPuzzleState):RuinPuzzleState{
  return state.solved&&!state.rewardClaimed?{...state,rewardClaimed:true}:state;
}

export function playerNearRuinPuzzle(layout:RuinPuzzleLayout,player:Vec3,range=14){
  return distance2(layout.center,player)<=range;
}

export function playerNearRuinStone(state:RuinPuzzleState,player:Vec3,range=2.35){
  return distance2(state.stonePosition,player)<=range;
}
