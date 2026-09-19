import type {AdventureCameraState,Vec3} from './types';

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

export const DEFAULT_ADVENTURE_CAMERA:AdventureCameraState={
  yaw:0,
  pitch:-.26,
  distance:12,
  target:{x:0,y:2,z:24},
};

export function rotateAdventureCamera(
  state:AdventureCameraState,
  yawDelta:number,
  pitchDelta:number,
):AdventureCameraState{
  return {
    ...state,
    yaw:finite(state.yaw)+finite(yawDelta),
    pitch:clamp(finite(state.pitch)+finite(pitchDelta),-.9,.18),
  };
}

export function zoomAdventureCamera(state:AdventureCameraState,delta:number):AdventureCameraState{
  return {...state,distance:clamp(finite(state.distance,12)+finite(delta),7,20)};
}

export function followAdventureCamera(
  state:AdventureCameraState,
  target:Vec3,
  dtRaw:number,
):AdventureCameraState{
  const dt=clamp(finite(dtRaw),0,.05);
  const alpha=1-Math.exp(-8*dt);
  return {
    ...state,
    target:{
      x:lerp(state.target.x,target.x,alpha),
      y:lerp(state.target.y,target.y,alpha),
      z:lerp(state.target.z,target.z,alpha),
    },
  };
}

export function adventureCameraEye(state:AdventureCameraState):Vec3{
  const horizontal=Math.cos(state.pitch)*state.distance;
  return {
    x:state.target.x-Math.sin(state.yaw)*horizontal,
    y:state.target.y-Math.sin(state.pitch)*state.distance,
    z:state.target.z+Math.cos(state.yaw)*horizontal,
  };
}

export function adventureCameraBasis(state:AdventureCameraState){
  const eye=adventureCameraEye(state);
  const fx=state.target.x-eye.x,fy=state.target.y-eye.y,fz=state.target.z-eye.z;
  const fl=Math.max(.0001,Math.hypot(fx,fy,fz));
  const forward={x:fx/fl,y:fy/fl,z:fz/fl};
  const rightLength=Math.max(.0001,Math.hypot(forward.z,forward.x));
  const right={x:-forward.z/rightLength,y:0,z:forward.x/rightLength};
  const up={
    x:right.y*forward.z-right.z*forward.y,
    y:right.z*forward.x-right.x*forward.z,
    z:right.x*forward.y-right.y*forward.x,
  };
  return {eye,forward,right,up};
}
