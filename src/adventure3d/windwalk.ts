import type {PlayerMotionState} from './types';

export const WINDWALK={
  label:'바람걸음',
  maxPlanarSpeed:7.2,
  forwardAcceleration:8.5,
  fallSpeed:-3.2,
  staminaPerSecond:20,
  minFallSpeed:-.85,
};

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export type WindwalkStepResult={
  state:PlayerMotionState;
  active:boolean;
};

export function windwalkUnlocked(beaconReached:boolean){
  return beaconReached===true;
}

export function canWindwalkGlide(
  state:PlayerMotionState,
  held:boolean,
  unlocked:boolean,
){
  return Boolean(
    unlocked&&
    held&&
    !state.grounded&&
    state.stamina>.5&&
    state.velocity.y<WINDWALK.minFallSpeed
  );
}

export function applyWindwalkGlide(
  state:PlayerMotionState,
  held:boolean,
  unlocked:boolean,
  dtRaw:number,
):WindwalkStepResult{
  const dt=clamp(finite(dtRaw),0,.05);
  if(!canWindwalkGlide(state,held,unlocked)||dt<=0)return {state,active:false};

  const forward={x:Math.sin(state.facingYaw),z:-Math.cos(state.facingYaw)};
  let vx=finite(state.velocity.x)+forward.x*WINDWALK.forwardAcceleration*dt;
  let vz=finite(state.velocity.z)+forward.z*WINDWALK.forwardAcceleration*dt;
  const planarSpeed=Math.hypot(vx,vz);
  if(planarSpeed>WINDWALK.maxPlanarSpeed){
    const scale=WINDWALK.maxPlanarSpeed/planarSpeed;
    vx*=scale;
    vz*=scale;
  }

  return {
    active:true,
    state:{
      ...state,
      velocity:{
        x:vx,
        y:Math.max(finite(state.velocity.y),WINDWALK.fallSpeed),
        z:vz,
      },
      stamina:Math.max(0,state.stamina-WINDWALK.staminaPerSecond*dt),
    },
  };
}
