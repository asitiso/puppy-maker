import type {PlayerMotionState,Vec3} from './types';
import type {TerrainHeight} from './player-controller';

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export type PlayerCombatState={
  hp:number;
  maxHp:number;
  attackClock:number;
  attackSerial:number;
  dodgeClock:number;
  dodgeCooldown:number;
  dodgeDirection:{x:number;z:number};
  invulnerability:number;
  hitstun:number;
  flash:number;
  counterWindow:number;
  counterAttackSerial:number;
  perfectDodgeFlash:number;
};

export const PLAYER_ATTACK_DAMAGE=18;
export const PLAYER_DODGE_STAMINA=22;
export const PLAYER_ATTACK_TOTAL=.48;
export const PLAYER_ATTACK_ACTIVE_START=.12;
export const PLAYER_ATTACK_ACTIVE_END=.27;
export const PLAYER_DODGE_TOTAL=.28;
export const PLAYER_DODGE_INVULNERABILITY=.24;
export const PLAYER_DODGE_COOLDOWN=.42;
export const PLAYER_PERFECT_DODGE_END=.14;
export const PLAYER_COUNTER_WINDOW=.85;
export const PLAYER_COUNTER_DAMAGE=30;
export const PLAYER_ATTACK_VERTICAL_REACH=2.6;

export const DEFAULT_PLAYER_COMBAT:PlayerCombatState={
  hp:100,
  maxHp:100,
  attackClock:-1,
  attackSerial:0,
  dodgeClock:-1,
  dodgeCooldown:0,
  dodgeDirection:{x:0,z:-1},
  invulnerability:0,
  hitstun:0,
  flash:0,
  counterWindow:0,
  counterAttackSerial:-1,
  perfectDodgeFlash:0,
};

export function stepPlayerCombat(state:PlayerCombatState,dtRaw:number):PlayerCombatState{
  const dt=clamp(finite(dtRaw),0,.05);
  const attackClock=state.attackClock<0
    ?-1
    :state.attackClock+dt>=PLAYER_ATTACK_TOTAL?-1:state.attackClock+dt;
  const dodgeClock=state.dodgeClock<0
    ?-1
    :state.dodgeClock+dt>=PLAYER_DODGE_TOTAL?-1:state.dodgeClock+dt;
  return {
    ...state,
    attackClock,
    dodgeClock,
    dodgeCooldown:Math.max(0,state.dodgeCooldown-dt),
    invulnerability:Math.max(0,state.invulnerability-dt),
    hitstun:Math.max(0,state.hitstun-dt),
    flash:Math.max(0,state.flash-dt),
    counterWindow:Math.max(0,state.counterWindow-dt),
    perfectDodgeFlash:Math.max(0,state.perfectDodgeFlash-dt),
  };
}

export function tryStartPlayerAttack(state:PlayerCombatState):PlayerCombatState{
  if(state.hp<=0||state.hitstun>0||state.dodgeClock>=0||state.attackClock>=0)return state;
  const attackSerial=state.attackSerial+1;
  const counter=state.counterWindow>0;
  return {
    ...state,
    attackClock:0,
    attackSerial,
    counterWindow:counter?0:state.counterWindow,
    counterAttackSerial:counter?attackSerial:state.counterAttackSerial,
  };
}

export function playerAttackIsCounter(state:PlayerCombatState):boolean{
  return state.attackClock>=0&&state.attackSerial===state.counterAttackSerial;
}

export function playerAttackDamage(state:PlayerCombatState):number{
  return playerAttackIsCounter(state)?PLAYER_COUNTER_DAMAGE:PLAYER_ATTACK_DAMAGE;
}

export function playerAttackWindowOpen(state:PlayerCombatState):boolean{
  return state.attackClock>=PLAYER_ATTACK_ACTIVE_START&&state.attackClock<=PLAYER_ATTACK_ACTIVE_END;
}

export function tryStartPlayerDodge(
  state:PlayerCombatState,
  stamina:number,
  requestedDirection:{x:number;z:number},
  facingYaw:number,
):{state:PlayerCombatState;stamina:number;started:boolean}{
  if(
    state.hp<=0||
    state.hitstun>0||
    state.dodgeClock>=0||
    state.dodgeCooldown>0||
    stamina<PLAYER_DODGE_STAMINA
  )return {state,stamina,started:false};

  const rawLength=Math.hypot(requestedDirection.x,requestedDirection.z);
  const direction=rawLength>.08
    ?{x:requestedDirection.x/rawLength,z:requestedDirection.z/rawLength}
    :{x:Math.sin(facingYaw),z:-Math.cos(facingYaw)};

  return {
    state:{
      ...state,
      attackClock:-1,
      dodgeClock:0,
      dodgeCooldown:PLAYER_DODGE_COOLDOWN,
      dodgeDirection:direction,
      invulnerability:Math.max(state.invulnerability,PLAYER_DODGE_INVULNERABILITY),
      counterWindow:0,
    },
    stamina:stamina-PLAYER_DODGE_STAMINA,
    started:true,
  };
}

export function applyDodgeMotion(
  motion:PlayerMotionState,
  combat:PlayerCombatState,
  dtRaw:number,
  terrainHeight:TerrainHeight,
  halfSize:number,
):PlayerMotionState{
  if(combat.dodgeClock<0||combat.dodgeClock>PLAYER_DODGE_TOTAL)return motion;
  const dt=clamp(finite(dtRaw),0,.05);
  const speed=13.5*(1-combat.dodgeClock/PLAYER_DODGE_TOTAL*.28);
  const x=clamp(motion.position.x+combat.dodgeDirection.x*speed*dt,-Math.abs(halfSize),Math.abs(halfSize));
  const z=clamp(motion.position.z+combat.dodgeDirection.z*speed*dt,-Math.abs(halfSize),Math.abs(halfSize));
  const y=Math.max(motion.position.y,terrainHeight(x,z));
  return {
    ...motion,
    position:{x,y,z},
    facingYaw:Math.atan2(combat.dodgeDirection.x,-combat.dodgeDirection.z),
  };
}

export function applyPlayerDamage(
  state:PlayerCombatState,
  damageRaw:number,
):{state:PlayerCombatState;damaged:boolean}{
  if(state.hp<=0||state.invulnerability>0)return {state,damaged:false};
  const damage=Math.max(0,Math.floor(finite(damageRaw)));
  if(damage<=0)return {state,damaged:false};
  const hp=Math.max(0,state.hp-damage);
  return {
    damaged:true,
    state:{
      ...state,
      hp,
      attackClock:-1,
      hitstun:hp>0?.28:0,
      invulnerability:hp>0?.46:0,
      flash:.18,
      counterWindow:0,
    },
  };
}

export function resolveEnemyAttack(
  state:PlayerCombatState,
  damageRaw:number,
):{state:PlayerCombatState;damaged:boolean;perfectDodged:boolean}{
  const perfect=
    state.hp>0&&
    state.dodgeClock>=0&&
    state.dodgeClock<=PLAYER_PERFECT_DODGE_END&&
    state.invulnerability>0;
  if(perfect){
    return {
      state:{
        ...state,
        counterWindow:Math.max(state.counterWindow,PLAYER_COUNTER_WINDOW),
        perfectDodgeFlash:.22,
      },
      damaged:false,
      perfectDodged:true,
    };
  }
  const hit=applyPlayerDamage(state,damageRaw);
  return {...hit,perfectDodged:false};
}

export function playerAttackConnects(
  player:Vec3,
  facingYaw:number,
  target:Vec3,
  targetRadius=.8,
):boolean{
  const dx=target.x-player.x;
  const dy=target.y-player.y;
  const dz=target.z-player.z;
  const distance=Math.hypot(dx,dz);
  if(
    distance>3.1+Math.max(0,targetRadius)||
    distance<.001||
    Math.abs(dy)>PLAYER_ATTACK_VERTICAL_REACH+Math.max(0,targetRadius*.35)
  )return false;
  const forward={x:Math.sin(facingYaw),z:-Math.cos(facingYaw)};
  const direction={x:dx/distance,z:dz/distance};
  return forward.x*direction.x+forward.z*direction.z>=Math.cos(58*Math.PI/180);
}
