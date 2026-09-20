import type {AdventureEnemyState,EnemyArchetype} from './enemy-ai';
import {STARTING_FIELD,startingFieldHeight} from './starting-field';
import type {Vec3} from './types';

export const SKYBREAK_HIGHLAND={
  label:'하늘갈림 고지',
  halfSize:18,
  spawn:{x:0,z:14},
  bridgeReturnOffset:{x:0,z:-4},
  beacon:{x:0,z:-14},
  beaconRadius:3.1,
  entrance:{x:0,z:16},
  entranceRadius:2.8,
  windLift:{x:7,z:-13.5},
  windLiftRadius:2.8,
  outsideLift:{x:4,z:-61},
  outsideLiftRadius:3.2,
  gustHalfWidth:4.2,
  gustBandHalfDepth:1.8,
  gustPushSpeed:8.2,
  gustPeriod:3,
  gustDuration:1.15,
  calmDuration:1.6,
};

const gustBandZ=[7,1,-5] as const;
const skybreakEnemyIds=new Set(['skybreak-scout-a','skybreak-scout-b']);

export type SkybreakHighlandState={
  inside:boolean;
  beaconReached:boolean;
  gustClock:number;
  calmClock:number;
};

export type SkybreakHighlandVisual={
  active:boolean;
  label:string;
  beacon:Vec3;
  beaconReached:boolean;
  entrance:Vec3;
  windLift:Vec3;
  windLiftOpen:boolean;
  gustBands:readonly {position:Vec3;active:boolean}[];
  gustActive:boolean;
  calmActive:boolean;
  nearbyEntrance:boolean;
  nearbyBeacon:boolean;
  nearbyWindLift:boolean;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const distance2=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);

export function skybreakHighlandHeight(x:number,z:number){
  const ridge=Math.max(0,1-Math.abs(x)/SKYBREAK_HIGHLAND.halfSize);
  const crest=Math.max(0,1-Math.hypot(x,z+9)/13);
  return 6+ridge*.7+crest*2.4;
}

const point=(x:number,z:number):Vec3=>({x,y:skybreakHighlandHeight(x,z),z});

function startingDiscovery(id:string){
  return STARTING_FIELD.discoveries.find(item=>item.id===id);
}

export function skybreakBridgePosition():Vec3{
  const bridge=startingDiscovery('old-bridge');
  const x=bridge?.position.x??12;
  const z=bridge?.position.z??61;
  return {x,y:startingFieldHeight(x,z),z};
}

export function skybreakOutsideLiftPosition():Vec3{
  const {x,z}=SKYBREAK_HIGHLAND.outsideLift;
  return {x,y:startingFieldHeight(x,z),z};
}

export function skybreakEntryPosition():Vec3{
  return point(SKYBREAK_HIGHLAND.spawn.x,SKYBREAK_HIGHLAND.spawn.z);
}

export function skybreakBeaconPosition():Vec3{
  return point(SKYBREAK_HIGHLAND.beacon.x,SKYBREAK_HIGHLAND.beacon.z);
}

export function skybreakWindLiftPosition():Vec3{
  return point(SKYBREAK_HIGHLAND.windLift.x,SKYBREAK_HIGHLAND.windLift.z);
}

export function createSkybreakHighlandState(beaconReached=false):SkybreakHighlandState{
  return {inside:false,beaconReached,gustClock:.35,calmClock:0};
}

export function enterSkybreakHighland(
  state:SkybreakHighlandState,
):SkybreakHighlandState{
  return {...state,inside:true,gustClock:.35,calmClock:0};
}

export function leaveSkybreakHighland(
  state:SkybreakHighlandState,
):SkybreakHighlandState{
  return {...state,inside:false,calmClock:0};
}

export function stepSkybreakHighland(
  state:SkybreakHighlandState,
  dtRaw:number,
):SkybreakHighlandState{
  if(!state.inside)return state;
  const dt=clamp(Number.isFinite(dtRaw)?dtRaw:0,0,.1);
  if(dt<=0)return state;
  return {
    ...state,
    gustClock:(state.gustClock+dt)%SKYBREAK_HIGHLAND.gustPeriod,
    calmClock:Math.max(0,state.calmClock-dt),
  };
}

export function skybreakGustActive(state:SkybreakHighlandState){
  return state.inside&&
    state.calmClock<=0&&
    state.gustClock<SKYBREAK_HIGHLAND.gustDuration;
}

export function castSkybreakWindPulse(
  state:SkybreakHighlandState,
):{state:SkybreakHighlandState;affected:boolean}{
  if(!state.inside)return {state,affected:false};
  return {
    state:{...state,calmClock:SKYBREAK_HIGHLAND.calmDuration},
    affected:true,
  };
}

export function playerInSkybreakGustBand(player:Vec3){
  return Math.abs(player.x)<=SKYBREAK_HIGHLAND.gustHalfWidth&&
    gustBandZ.some(z=>Math.abs(player.z-z)<=SKYBREAK_HIGHLAND.gustBandHalfDepth);
}

export function applySkybreakGust(
  position:Vec3,
  state:SkybreakHighlandState,
  dodging:boolean,
  dtRaw:number,
):{position:Vec3;pushed:boolean}{
  if(dodging||!skybreakGustActive(state)||!playerInSkybreakGustBand(position)){
    return {position,pushed:false};
  }
  const dt=clamp(Number.isFinite(dtRaw)?dtRaw:0,0,.1);
  const z=clamp(
    position.z+SKYBREAK_HIGHLAND.gustPushSpeed*dt,
    -SKYBREAK_HIGHLAND.halfSize,
    SKYBREAK_HIGHLAND.halfSize,
  );
  return {
    position:{x:position.x,y:skybreakHighlandHeight(position.x,z),z},
    pushed:true,
  };
}

export function playerNearSkybreakBridge(
  player:Vec3,
  shortcutOpen:boolean,
  range=4.6,
){
  return shortcutOpen&&distance2(player,skybreakBridgePosition())<=range;
}

export function playerNearSkybreakOutsideLift(
  player:Vec3,
  beaconReached:boolean,
){
  return beaconReached&&distance2(player,skybreakOutsideLiftPosition())<=SKYBREAK_HIGHLAND.outsideLiftRadius;
}

export function playerNearSkybreakEntrance(
  player:Vec3,
  state:SkybreakHighlandState,
){
  return state.inside&&distance2(player,point(SKYBREAK_HIGHLAND.entrance.x,SKYBREAK_HIGHLAND.entrance.z))
    <=SKYBREAK_HIGHLAND.entranceRadius;
}

export function playerNearSkybreakBeacon(
  player:Vec3,
  state:SkybreakHighlandState,
){
  return state.inside&&!state.beaconReached&&
    distance2(player,skybreakBeaconPosition())<=SKYBREAK_HIGHLAND.beaconRadius;
}

export function playerNearSkybreakWindLift(
  player:Vec3,
  state:SkybreakHighlandState,
){
  return state.inside&&state.beaconReached&&
    distance2(player,skybreakWindLiftPosition())<=SKYBREAK_HIGHLAND.windLiftRadius;
}

export function reachSkybreakBeacon(
  state:SkybreakHighlandState,
):SkybreakHighlandState{
  return state.beaconReached?state:{...state,beaconReached:true,calmClock:SKYBREAK_HIGHLAND.calmDuration};
}

export function constrainSkybreakPlayer(position:Vec3):Vec3{
  const x=clamp(position.x,-SKYBREAK_HIGHLAND.halfSize,SKYBREAK_HIGHLAND.halfSize);
  const z=clamp(position.z,-SKYBREAK_HIGHLAND.halfSize,SKYBREAK_HIGHLAND.halfSize);
  return {x,y:skybreakHighlandHeight(x,z),z};
}

export function skybreakReturnToBridge():Vec3{
  const bridge=skybreakBridgePosition();
  const z=bridge.z+SKYBREAK_HIGHLAND.bridgeReturnOffset.z;
  return {x:bridge.x,y:startingFieldHeight(bridge.x,z),z};
}

export function skybreakReturnToSkywatch():Vec3{
  const lift=skybreakOutsideLiftPosition();
  return {x:lift.x,y:startingFieldHeight(lift.x,lift.z+3),z:lift.z+3};
}

export function skybreakWindLiftEntry():Vec3{
  return point(SKYBREAK_HIGHLAND.windLift.x-2,SKYBREAK_HIGHLAND.windLift.z+2);
}

function enemy(
  id:string,
  label:string,
  archetype:EnemyArchetype,
  x:number,
  z:number,
  hp:number,
  patrolPlan:readonly [number,number][],
):AdventureEnemyState{
  const home=point(x,z);
  return {
    id,
    label,
    archetype,
    position:home,
    home,
    patrol:patrolPlan.map(([px,pz])=>point(px,pz)),
    patrolIndex:0,
    hp,
    maxHp:hp,
    mode:'patrol',
    timer:0,
    facingYaw:0,
    lastHitAttackSerial:-1,
  };
}

export function createSkybreakEnemies(beaconReached=false):AdventureEnemyState[]{
  if(beaconReached)return [];
  return [
    enemy(
      'skybreak-scout-a',
      '능선 추적자',
      'rusher',
      10,
      6,
      46,
      [[10,6],[12,1],[9,-3]],
    ),
    enemy(
      'skybreak-scout-b',
      '능선 파수꾼',
      'guard',
      10,
      -6,
      66,
      [[10,-6],[12,-10],[8,-12]],
    ),
  ];
}

export function isSkybreakEnemy(enemy:AdventureEnemyState|string){
  return skybreakEnemyIds.has(typeof enemy==='string'?enemy:enemy.id);
}

export function skybreakHighlandVisual(
  state:SkybreakHighlandState,
  player:Vec3,
):SkybreakHighlandVisual|null{
  if(!state.inside)return null;
  const gustActive=skybreakGustActive(state);
  return {
    active:true,
    label:SKYBREAK_HIGHLAND.label,
    beacon:skybreakBeaconPosition(),
    beaconReached:state.beaconReached,
    entrance:point(SKYBREAK_HIGHLAND.entrance.x,SKYBREAK_HIGHLAND.entrance.z),
    windLift:skybreakWindLiftPosition(),
    windLiftOpen:state.beaconReached,
    gustBands:gustBandZ.map(z=>({
      position:point(0,z),
      active:gustActive,
    })),
    gustActive,
    calmActive:state.calmClock>0,
    nearbyEntrance:playerNearSkybreakEntrance(player,state),
    nearbyBeacon:playerNearSkybreakBeacon(player,state),
    nearbyWindLift:playerNearSkybreakWindLift(player,state),
  };
}
