import type {AdventureCameraState,Vec3} from './types';

export type CombatFeedbackKind=
  |'hit'
  |'counter'
  |'guard-break'
  |'player-hit'
  |'phase-break'
  |'defeat';

export type CombatFeedbackEvent={
  id:number;
  kind:CombatFeedbackKind;
  position:Vec3;
  amount?:number;
  label?:string;
  remaining:number;
  duration:number;
};

export type CombatFeedbackState={
  events:CombatFeedbackEvent[];
  hitStop:number;
  cameraImpulse:number;
  cameraClock:number;
  serial:number;
};

export const DEFAULT_COMBAT_FEEDBACK:CombatFeedbackState={
  events:[],
  hitStop:0,
  cameraImpulse:0,
  cameraClock:0,
  serial:0,
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;

export function stepCombatFeedback(
  state:CombatFeedbackState,
  dtRaw:number,
):CombatFeedbackState{
  const dt=clamp(finite(dtRaw),0,.25);
  if(dt<=0)return state;
  const events=state.events
    .map(event=>({...event,remaining:Math.max(0,event.remaining-dt)}))
    .filter(event=>event.remaining>1e-6);
  return {
    ...state,
    events,
    hitStop:Math.max(0,state.hitStop-dt),
    cameraImpulse:Math.max(0,state.cameraImpulse-dt*3.5),
    cameraClock:state.cameraClock+dt,
  };
}

export function pushCombatFeedback(
  state:CombatFeedbackState,
  event:{
    kind:CombatFeedbackKind;
    position:Vec3;
    amount?:number;
    label?:string;
    duration?:number;
    hitStop?:number;
    cameraImpulse?:number;
  },
):CombatFeedbackState{
  const duration=clamp(finite(event.duration,.58),.12,1.4);
  const serial=state.serial+1;
  return {
    ...state,
    serial,
    events:[
      ...state.events.slice(-7),
      {
        id:serial,
        kind:event.kind,
        position:{...event.position},
        amount:event.amount,
        label:event.label,
        remaining:duration,
        duration,
      },
    ],
    hitStop:Math.max(state.hitStop,clamp(finite(event.hitStop),0,.16)),
    cameraImpulse:Math.max(state.cameraImpulse,clamp(finite(event.cameraImpulse),0,1.2)),
  };
}

export function combatFeedbackTimeScale(state:CombatFeedbackState){
  return state.hitStop>0?.12:1;
}

export function combatFeedbackCamera(
  camera:AdventureCameraState,
  state:CombatFeedbackState,
):AdventureCameraState{
  if(state.cameraImpulse<=.001)return camera;
  const strength=state.cameraImpulse;
  const clock=state.cameraClock;
  return {
    ...camera,
    yaw:camera.yaw+Math.sin(clock*71+state.serial*.77)*.014*strength,
    pitch:camera.pitch+Math.cos(clock*83+state.serial*.41)*.009*strength,
    target:{
      ...camera.target,
      x:camera.target.x+Math.sin(clock*97+state.serial)*.055*strength,
      y:camera.target.y+Math.cos(clock*89+state.serial*.3)*.04*strength,
    },
  };
}
