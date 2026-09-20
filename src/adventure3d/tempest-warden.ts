import {
  SKIMMER_HOVER_HEIGHT,
  type AdventureEnemyState,
} from './enemy-ai';
import {startingFieldHeight} from './starting-field';
import type {TerrainHeight} from './player-controller';
import type {Vec3} from './types';

export const TEMPEST_WARDEN={
  id:'tempest-warden',
  label:'폭풍갑주 감시자',
  maxHp:150,
  phaseTwoHp:75,
  spawn:{x:-76,z:8},
  patrol:[
    [-76,8],
    [-68,2],
    [-72,-7],
    [-84,0],
  ] as const,
};

const groundPoint=(x:number,z:number):Vec3=>({
  x,
  y:startingFieldHeight(x,z),
  z,
});

export function createTempestWarden(
  cloudGardenRestored:boolean,
  defeated:boolean,
):AdventureEnemyState|null{
  if(!cloudGardenRestored||defeated)return null;
  const home=groundPoint(TEMPEST_WARDEN.spawn.x,TEMPEST_WARDEN.spawn.z);
  return {
    id:TEMPEST_WARDEN.id,
    label:TEMPEST_WARDEN.label,
    archetype:'guard',
    position:home,
    home,
    patrol:TEMPEST_WARDEN.patrol.map(([x,z])=>groundPoint(x,z)),
    patrolIndex:0,
    hp:TEMPEST_WARDEN.maxHp,
    maxHp:TEMPEST_WARDEN.maxHp,
    mode:'patrol',
    timer:0,
    facingYaw:0,
    lastHitAttackSerial:-1,
  };
}

export function isTempestWarden(enemy:AdventureEnemyState|string){
  return (typeof enemy==='string'?enemy:enemy.id)===TEMPEST_WARDEN.id;
}

export function tempestWardenPhase(enemy:AdventureEnemyState|null|undefined):1|2|null{
  if(!enemy||!isTempestWarden(enemy)||enemy.hp<=0)return null;
  return enemy.archetype==='skimmer'||enemy.hp<=TEMPEST_WARDEN.phaseTwoHp?2:1;
}

export function advanceTempestWardenPhase(
  enemy:AdventureEnemyState,
  terrainHeight:TerrainHeight=startingFieldHeight,
):{enemy:AdventureEnemyState;changed:boolean}{
  if(
    !isTempestWarden(enemy)||
    enemy.hp<=0||
    enemy.archetype==='skimmer'||
    enemy.hp>TEMPEST_WARDEN.phaseTwoHp
  )return {enemy,changed:false};

  const y=terrainHeight(enemy.position.x,enemy.position.z)+SKIMMER_HOVER_HEIGHT;
  return {
    enemy:{
      ...enemy,
      archetype:'skimmer',
      position:{...enemy.position,y},
      home:{
        ...enemy.home,
        y:terrainHeight(enemy.home.x,enemy.home.z)+SKIMMER_HOVER_HEIGHT,
      },
      patrol:enemy.patrol.map(point=>({
        ...point,
        y:terrainHeight(point.x,point.z)+SKIMMER_HOVER_HEIGHT,
      })),
      mode:'stagger',
      timer:.7,
    },
    changed:true,
  };
}

export function mergeTempestWarden(
  enemies:readonly AdventureEnemyState[],
  cloudGardenRestored:boolean,
  defeated:boolean,
):AdventureEnemyState[]{
  if(!cloudGardenRestored||defeated||enemies.some(isTempestWarden))return [...enemies];
  const boss=createTempestWarden(true,false);
  return boss?[...enemies,boss]:[...enemies];
}


export function disruptTempestWardenWithWind(
  enemy:AdventureEnemyState,
  player:Vec3,
  facingYaw:number,
  terrainHeight:TerrainHeight=startingFieldHeight,
):{enemy:AdventureEnemyState;affected:boolean}{
  if(!isTempestWarden(enemy)||enemy.hp<=0||tempestWardenPhase(enemy)!==2){
    return {enemy,affected:false};
  }
  const dx=enemy.position.x-player.x;
  const dz=enemy.position.z-player.z;
  const distance=Math.hypot(dx,dz);
  if(distance>.001&&distance<=8.5){
    const forward={x:Math.sin(facingYaw),z:-Math.cos(facingYaw)};
    const dot=forward.x*(dx/distance)+forward.z*(dz/distance);
    if(dot>=Math.cos(72*Math.PI/180)){
      return {
        enemy:{
          ...enemy,
          position:{
            ...enemy.position,
            y:terrainHeight(enemy.position.x,enemy.position.z)+1.3,
          },
          mode:'stagger',
          timer:1.15,
        },
        affected:true,
      };
    }
  }
  return {enemy,affected:false};
}
