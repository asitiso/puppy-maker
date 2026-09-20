import type {AdventureCameraState,AdventureDiscovery,Vec3} from './types';

export const DAWNREACH_OPENING={
  cinematicDuration:3.2,
  titleDuration:3.8,
  moveDistance:3.2,
  revealDuration:2.25,
};

export type DawnreachOpeningState={
  active:boolean;
  clock:number;
  origin:Vec3;
  moved:boolean;
  looked:boolean;
};

export type DiscoveryReveal={
  id:string;
  label:string;
  hint:string;
  position:Vec3;
  remaining:number;
  duration:number;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;

export function freshDawnreachOpeningEligible(progress:{
  discoveredCount:number;
  campCleared:boolean;
  echoSenseUnlocked:boolean;
  skybreakBeaconReached:boolean;
  cloudGardenRestored:boolean;
  tempestWardenDefeated:boolean;
}){
  return (
    progress.discoveredCount===0&&
    !progress.campCleared&&
    !progress.echoSenseUnlocked&&
    !progress.skybreakBeaconReached&&
    !progress.cloudGardenRestored&&
    !progress.tempestWardenDefeated
  );
}

export function createDawnreachOpeningState(
  active:boolean,
  origin:Vec3,
):DawnreachOpeningState{
  return {
    active,
    clock:0,
    origin:{...origin},
    moved:false,
    looked:false,
  };
}

export function stepDawnreachOpening(
  state:DawnreachOpeningState,
  player:Vec3,
  dtRaw:number,
):DawnreachOpeningState{
  if(!state.active)return state;
  const dt=clamp(finite(dtRaw),0,.25);
  const moved=state.moved||Math.hypot(
    player.x-state.origin.x,
    player.z-state.origin.z,
  )>=DAWNREACH_OPENING.moveDistance;
  return {
    ...state,
    clock:state.clock+dt,
    moved,
  };
}

export function markDawnreachOpeningLooked(
  state:DawnreachOpeningState,
):DawnreachOpeningState{
  if(!state.active||state.looked)return state;
  return {...state,looked:true};
}

export function completeDawnreachOpening(
  state:DawnreachOpeningState,
):DawnreachOpeningState{
  if(!state.active)return state;
  return {...state,active:false};
}

export function dawnreachOpeningCamera(
  camera:AdventureCameraState,
  state:DawnreachOpeningState,
):AdventureCameraState{
  if(
    !state.active||
    state.moved||
    state.looked||
    state.clock>=DAWNREACH_OPENING.cinematicDuration
  )return camera;

  const t=clamp(state.clock/DAWNREACH_OPENING.cinematicDuration,0,1);
  const eased=1-Math.pow(1-t,3);
  return {
    ...camera,
    distance:lerp(17.5,camera.distance,eased),
    pitch:lerp(-.38,camera.pitch,eased),
  };
}

export function dawnreachOpeningGuidance(
  state:DawnreachOpeningState,
  nearbyLabel:string|null,
):string|null{
  if(!state.active)return null;
  if(state.clock<DAWNREACH_OPENING.titleDuration){
    return '앞쪽 높은 전망대 · 왼쪽 빛나는 폐허 · 오른쪽 연기 — 마음이 가는 곳을 직접 골라 움직여 보세요.';
  }
  if(!state.moved)return 'WASD / 왼쪽 스틱으로 이동해 보세요.';
  if(!state.looked)return '마우스나 화면 드래그로 주변을 둘러보세요.';
  if(nearbyLabel)return `${nearbyLabel} 가까이 왔습니다 · F / 발견 버튼으로 장소를 기록할 수 있습니다.`;
  return '퀘스트 화살표 대신 지형의 높이, 빛, 연기와 소리를 따라가 보세요.';
}

export function createDiscoveryReveal(
  discovery:AdventureDiscovery,
):DiscoveryReveal{
  return {
    id:discovery.id,
    label:discovery.label,
    hint:discovery.hint,
    position:{...discovery.position},
    remaining:DAWNREACH_OPENING.revealDuration,
    duration:DAWNREACH_OPENING.revealDuration,
  };
}

export function stepDiscoveryReveal(
  reveal:DiscoveryReveal|null,
  dtRaw:number,
):DiscoveryReveal|null{
  if(!reveal)return null;
  const dt=clamp(finite(dtRaw),0,.25);
  const remaining=reveal.remaining-dt;
  if(remaining<=1e-6)return null;
  return {...reveal,remaining};
}
