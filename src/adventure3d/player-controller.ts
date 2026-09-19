import type {PlayerMotionInput,PlayerMotionState,Vec3} from './types';

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const approach=(value:number,target:number,amount:number)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);

export type TerrainHeight=(x:number,z:number)=>number;

export const DEFAULT_PLAYER_STATE:PlayerMotionState={
  position:{x:0,y:0,z:24},
  velocity:{x:0,y:0,z:0},
  grounded:true,
  stamina:100,
  facingYaw:0,
};

export function normalizePlanar(x:number,z:number){
  const safeX=finite(x),safeZ=finite(z);
  const magnitude=Math.hypot(safeX,safeZ);
  if(magnitude<=1)return {x:safeX,z:safeZ};
  return {x:safeX/magnitude,z:safeZ/magnitude};
}

export function stepPlayerMotion(
  state:PlayerMotionState,
  input:PlayerMotionInput,
  dtRaw:number,
  terrainHeight:TerrainHeight,
  halfSize:number,
):PlayerMotionState{
  const dt=clamp(finite(dtRaw),0,.05);
  const inputDir=normalizePlanar(input.moveX,input.moveZ);
  const inputMagnitude=Math.min(1,Math.hypot(inputDir.x,inputDir.z));
  const sprinting=Boolean(input.sprint&&state.stamina>0.5&&inputMagnitude>.1&&state.grounded);
  const targetSpeed=sprinting?9:5.4;
  const acceleration=state.grounded?25:8;
  const braking=state.grounded?30:4;
  const desiredX=inputDir.x*targetSpeed;
  const desiredZ=inputDir.z*targetSpeed;
  let vx=inputMagnitude>.01?approach(finite(state.velocity.x),desiredX,acceleration*dt):approach(finite(state.velocity.x),0,braking*dt);
  let vz=inputMagnitude>.01?approach(finite(state.velocity.z),desiredZ,acceleration*dt):approach(finite(state.velocity.z),0,braking*dt);
  let vy=finite(state.velocity.y);
  let grounded=Boolean(state.grounded);
  const currentGround=finite(terrainHeight(state.position.x,state.position.z));
  let y=Math.max(finite(state.position.y,currentGround),currentGround);

  if(input.jump&&grounded){
    vy=8.4;
    grounded=false;
  }
  if(!grounded)vy-=22*dt;

  let x=clamp(finite(state.position.x)+vx*dt,-Math.abs(halfSize),Math.abs(halfSize));
  let z=clamp(finite(state.position.z)+vz*dt,-Math.abs(halfSize),Math.abs(halfSize));
  y+=vy*dt;
  const nextGround=finite(terrainHeight(x,z));
  if(y<=nextGround){
    y=nextGround;
    vy=0;
    grounded=true;
  }else grounded=false;

  const horizontalSpeed=Math.hypot(vx,vz);
  const facingYaw=horizontalSpeed>.15?Math.atan2(vx,-vz):state.facingYaw;
  const stamina=sprinting
    ?clamp(state.stamina-24*dt,0,100)
    :clamp(state.stamina+(grounded?17:8)*dt,0,100);

  if(Math.abs(x)>=Math.abs(halfSize)-.001)vx=0;
  if(Math.abs(z)>=Math.abs(halfSize)-.001)vz=0;

  return {position:{x,y,z},velocity:{x:vx,y:vy,z:vz},grounded,stamina,facingYaw};
}

export function cameraRelativeMove(
  strafe:number,
  forward:number,
  cameraYaw:number,
):Pick<Vec3,'x'|'z'>{
  const input=normalizePlanar(strafe,forward);
  const forwardX=Math.sin(cameraYaw);
  const forwardZ=-Math.cos(cameraYaw);
  const rightX=Math.cos(cameraYaw);
  const rightZ=Math.sin(cameraYaw);
  return normalizePlanar(
    rightX*input.x+forwardX*input.z,
    rightZ*input.x+forwardZ*input.z,
  );
}
