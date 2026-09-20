import type {AdventureEnemyState,EnemyArchetype} from './enemy-ai';
import {startingFieldHeight} from './starting-field';
import type {Vec3} from './types';

export const CLOUD_GARDEN={
  label:'구름정원',
  halfSize:16,
  outsideEntrance:{x:-69,z:-13},
  outsideRadius:4.8,
  entry:{x:0,z:13},
  exit:{x:0,z:14},
  exitRadius:2.8,
  heart:{x:0,z:-10},
  heartRadius:3.6,
};

const cloudEnemyIds=new Set([
  'cloud-sprout-a',
  'cloud-sprout-b',
  'cloud-root-warden',
]);

export type CloudGardenState={
  inside:boolean;
  restored:boolean;
};

export type CloudGardenVisual={
  active:boolean;
  label:string;
  restored:boolean;
  entrance:Vec3;
  heart:Vec3;
  nearbyExit:boolean;
  nearbyHeart:boolean;
  enemiesDefeated:boolean;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const distance2=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);

export function cloudGardenHeight(x:number,z:number){
  const center=Math.max(0,1-Math.hypot(x,z+2)/15);
  const rim=Math.max(0,1-Math.abs(x)/CLOUD_GARDEN.halfSize);
  return 9+center*1.8+rim*.4;
}

const localPoint=(x:number,z:number):Vec3=>({x,y:cloudGardenHeight(x,z),z});

export function cloudGardenOutsideEntrancePosition():Vec3{
  const {x,z}=CLOUD_GARDEN.outsideEntrance;
  return {x,y:startingFieldHeight(x,z),z};
}

export function cloudGardenOutsideReturnPosition():Vec3{
  const {x,z}=CLOUD_GARDEN.outsideEntrance;
  const returnZ=z+4;
  return {x,y:startingFieldHeight(x,returnZ),z:returnZ};
}

export function cloudGardenEntryPosition():Vec3{
  return localPoint(CLOUD_GARDEN.entry.x,CLOUD_GARDEN.entry.z);
}

export function cloudGardenHeartPosition():Vec3{
  return localPoint(CLOUD_GARDEN.heart.x,CLOUD_GARDEN.heart.z);
}

export function createCloudGardenState(restored=false):CloudGardenState{
  return {inside:false,restored};
}

export function enterCloudGarden(state:CloudGardenState):CloudGardenState{
  return {...state,inside:true};
}

export function leaveCloudGarden(state:CloudGardenState):CloudGardenState{
  return {...state,inside:false};
}

export function restoreCloudGarden(state:CloudGardenState):CloudGardenState{
  return state.restored?state:{...state,restored:true};
}

export function playerNearCloudGardenOutsideEntrance(
  player:Vec3,
  mastered:boolean,
){
  return mastered&&distance2(player,cloudGardenOutsideEntrancePosition())<=CLOUD_GARDEN.outsideRadius;
}

export function playerNearCloudGardenExit(player:Vec3,state:CloudGardenState){
  return state.inside&&distance2(player,localPoint(CLOUD_GARDEN.exit.x,CLOUD_GARDEN.exit.z))<=CLOUD_GARDEN.exitRadius;
}

export function playerNearCloudGardenHeart(player:Vec3,state:CloudGardenState){
  return state.inside&&!state.restored&&distance2(player,cloudGardenHeartPosition())<=CLOUD_GARDEN.heartRadius;
}

export function constrainCloudGardenPlayer(position:Vec3):Vec3{
  const x=clamp(position.x,-CLOUD_GARDEN.halfSize,CLOUD_GARDEN.halfSize);
  const z=clamp(position.z,-CLOUD_GARDEN.halfSize,CLOUD_GARDEN.halfSize);
  return {x,y:cloudGardenHeight(x,z),z};
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
  const home=localPoint(x,z);
  return {
    id,
    label,
    archetype,
    position:home,
    home,
    patrol:patrolPlan.map(([px,pz])=>localPoint(px,pz)),
    patrolIndex:0,
    hp,
    maxHp:hp,
    mode:'patrol',
    timer:0,
    facingYaw:0,
    lastHitAttackSerial:-1,
  };
}

export function createCloudGardenEnemies(restored=false):AdventureEnemyState[]{
  if(restored)return [];
  return [
    enemy(
      'cloud-sprout-a',
      '폭풍싹',
      'rusher',
      -7,
      1,
      38,
      [[-7,1],[-5,-4],[-8,-7]],
    ),
    enemy(
      'cloud-sprout-b',
      '폭풍싹',
      'rusher',
      7,
      1,
      38,
      [[7,1],[5,-4],[8,-7]],
    ),
    enemy(
      'cloud-root-warden',
      '구름뿌리 수호자',
      'guard',
      0,
      -6,
      78,
      [[0,-6],[-3,-9],[3,-9]],
    ),
  ];
}

export function isCloudGardenEnemy(enemy:AdventureEnemyState|string){
  return cloudEnemyIds.has(typeof enemy==='string'?enemy:enemy.id);
}

export function cloudGardenEnemiesDefeated(enemies:readonly AdventureEnemyState[]){
  const participants=enemies.filter(enemy=>isCloudGardenEnemy(enemy));
  return participants.length===cloudEnemyIds.size&&
    participants.every(enemy=>enemy.hp<=0||enemy.mode==='defeated');
}

export function cloudGardenVisual(
  state:CloudGardenState,
  player:Vec3,
  enemies:readonly AdventureEnemyState[],
):CloudGardenVisual|null{
  if(!state.inside)return null;
  const defeated=state.restored||cloudGardenEnemiesDefeated(enemies);
  return {
    active:true,
    label:CLOUD_GARDEN.label,
    restored:state.restored,
    entrance:localPoint(CLOUD_GARDEN.exit.x,CLOUD_GARDEN.exit.z),
    heart:cloudGardenHeartPosition(),
    nearbyExit:playerNearCloudGardenExit(player,state),
    nearbyHeart:playerNearCloudGardenHeart(player,state),
    enemiesDefeated:defeated,
  };
}
