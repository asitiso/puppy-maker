import type {Vec3} from './types';
import type {TerrainHeight} from './player-controller';

export type EnemyArchetype='rusher'|'guard';
export type EnemyAiMode='patrol'|'suspicious'|'chase'|'windup'|'recover'|'return'|'stagger'|'defeated';

export type AdventureEnemyState={
  id:string;
  label:string;
  archetype:EnemyArchetype;
  position:Vec3;
  home:Vec3;
  patrol:readonly Vec3[];
  patrolIndex:number;
  hp:number;
  maxHp:number;
  mode:EnemyAiMode;
  timer:number;
  facingYaw:number;
  lastHitAttackSerial:number;
};

export type EnemyAttackEvent={
  enemyId:string;
  damage:number;
  origin:Vec3;
  range:number;
};

export type EnemyAvoidanceZone={
  position:Vec3;
  radius:number;
  weight?:number;
};

type ArchetypeConfig={
  moveSpeed:number;
  chaseSpeed:number;
  sight:number;
  hearing:number;
  attackRange:number;
  windup:number;
  recovery:number;
  damage:number;
  leash:number;
};

const CONFIG:Record<EnemyArchetype,ArchetypeConfig>={
  rusher:{moveSpeed:1.7,chaseSpeed:4.2,sight:18,hearing:6.5,attackRange:2.1,windup:.58,recovery:.58,damage:13,leash:28},
  guard:{moveSpeed:1.3,chaseSpeed:3.1,sight:20,hearing:6,attackRange:2.4,windup:.82,recovery:.72,damage:18,leash:24},
};

const clampDt=(value:number)=>Math.min(.05,Math.max(0,Number.isFinite(value)?value:0));
const distance2=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.z-b.z);

function faceToward(from:Vec3,to:Vec3,fallback:number){
  const dx=to.x-from.x,dz=to.z-from.z;
  return Math.hypot(dx,dz)>.001?Math.atan2(dx,-dz):fallback;
}

function moveToward(
  position:Vec3,
  target:Vec3,
  speed:number,
  dt:number,
  terrainHeight:TerrainHeight,
  avoidanceZones:readonly EnemyAvoidanceZone[]=[],
):Vec3{
  const dx=target.x-position.x,dz=target.z-position.z;
  const distance=Math.hypot(dx,dz);
  if(distance<.001)return {...position,y:terrainHeight(position.x,position.z)};

  let moveX=dx/distance;
  let moveZ=dz/distance;
  for(const zone of avoidanceZones){
    const zx=position.x-zone.position.x;
    const zz=position.z-zone.position.z;
    const zoneDistance=Math.hypot(zx,zz);
    const influenceRadius=Math.max(0,zone.radius)+2.4;
    if(zoneDistance>=influenceRadius)continue;
    const safeDistance=Math.max(.001,zoneDistance);
    const influence=(1-zoneDistance/influenceRadius)*Math.max(.1,zone.weight??1.7);
    moveX+=zx/safeDistance*influence;
    moveZ+=zz/safeDistance*influence;
  }

  const moveLength=Math.max(.001,Math.hypot(moveX,moveZ));
  const step=Math.min(distance,speed*dt);
  const x=position.x+moveX/moveLength*step;
  const z=position.z+moveZ/moveLength*step;
  return {x,y:terrainHeight(x,z),z};
}

export function canEnemySeePlayer(enemy:AdventureEnemyState,player:Vec3):boolean{
  if(enemy.mode==='defeated')return false;
  const config=CONFIG[enemy.archetype];
  const dx=player.x-enemy.position.x,dz=player.z-enemy.position.z;
  const distance=Math.hypot(dx,dz);
  if(distance<=config.hearing)return true;
  if(distance>config.sight||distance<.001)return false;
  const forward={x:Math.sin(enemy.facingYaw),z:-Math.cos(enemy.facingYaw)};
  return forward.x*(dx/distance)+forward.z*(dz/distance)>=Math.cos(72*Math.PI/180);
}

export function stepEnemyAi(
  enemy:AdventureEnemyState,
  player:Vec3,
  dtRaw:number,
  terrainHeight:TerrainHeight,
  avoidanceZones:readonly EnemyAvoidanceZone[]=[],
):{enemy:AdventureEnemyState;attack:EnemyAttackEvent|null}{
  if(enemy.mode==='defeated'||enemy.hp<=0)return {enemy:{...enemy,hp:0,mode:'defeated',timer:0},attack:null};
  const dt=clampDt(dtRaw);
  const config=CONFIG[enemy.archetype];
  const playerDistance=distance2(enemy.position,player);
  const homeDistance=distance2(enemy.position,enemy.home);
  const seesPlayer=canEnemySeePlayer(enemy,player);

  if(enemy.mode==='stagger'){
    const timer=Math.max(0,enemy.timer-dt);
    return {enemy:{...enemy,timer,mode:timer<=0?'chase':'stagger'},attack:null};
  }

  if(enemy.mode==='windup'){
    const timer=Math.max(0,enemy.timer-dt);
    const facingYaw=faceToward(enemy.position,player,enemy.facingYaw);
    if(timer>0)return {enemy:{...enemy,timer,facingYaw},attack:null};
    const attack=playerDistance<=config.attackRange+.55
      ?{enemyId:enemy.id,damage:config.damage,origin:enemy.position,range:config.attackRange+.55}
      :null;
    return {enemy:{...enemy,mode:'recover',timer:config.recovery,facingYaw},attack};
  }

  if(enemy.mode==='recover'){
    const timer=Math.max(0,enemy.timer-dt);
    return {enemy:{...enemy,timer,mode:timer<=0?'chase':'recover'},attack:null};
  }

  if(enemy.mode==='suspicious'){
    const timer=Math.max(0,enemy.timer-dt);
    const facingYaw=faceToward(enemy.position,player,enemy.facingYaw);
    if(!seesPlayer&&playerDistance>config.sight*1.1)return {enemy:{...enemy,mode:'return',timer:0,facingYaw},attack:null};
    return {enemy:{...enemy,timer,mode:timer<=0?'chase':'suspicious',facingYaw},attack:null};
  }

  if(enemy.mode==='chase'){
    if(homeDistance>config.leash||playerDistance>config.leash+8)return {enemy:{...enemy,mode:'return',timer:0},attack:null};
    const facingYaw=faceToward(enemy.position,player,enemy.facingYaw);
    if(playerDistance<=config.attackRange){
      return {enemy:{...enemy,mode:'windup',timer:config.windup,facingYaw},attack:null};
    }
    const position=moveToward(enemy.position,player,config.chaseSpeed,dt,terrainHeight,avoidanceZones);
    return {enemy:{...enemy,position,facingYaw},attack:null};
  }

  if(enemy.mode==='return'){
    if(seesPlayer&&homeDistance<config.leash*.75)return {enemy:{...enemy,mode:'suspicious',timer:.35,facingYaw:faceToward(enemy.position,player,enemy.facingYaw)},attack:null};
    if(homeDistance<.6)return {enemy:{...enemy,position:{...enemy.home,y:terrainHeight(enemy.home.x,enemy.home.z)},mode:'patrol',timer:0},attack:null};
    const facingYaw=faceToward(enemy.position,enemy.home,enemy.facingYaw);
    const position=moveToward(enemy.position,enemy.home,config.moveSpeed*1.2,dt,terrainHeight,avoidanceZones);
    return {enemy:{...enemy,position,facingYaw},attack:null};
  }

  if(seesPlayer)return {enemy:{...enemy,mode:'suspicious',timer:.42,facingYaw:faceToward(enemy.position,player,enemy.facingYaw)},attack:null};

  const patrolTarget=enemy.patrol[enemy.patrolIndex%Math.max(1,enemy.patrol.length)]??enemy.home;
  const patrolDistance=distance2(enemy.position,patrolTarget);
  if(patrolDistance<.6){
    const patrolIndex=(enemy.patrolIndex+1)%Math.max(1,enemy.patrol.length);
    return {enemy:{...enemy,patrolIndex,timer:0},attack:null};
  }
  const facingYaw=faceToward(enemy.position,patrolTarget,enemy.facingYaw);
  const position=moveToward(enemy.position,patrolTarget,config.moveSpeed,dt,terrainHeight,avoidanceZones);
  return {enemy:{...enemy,position,facingYaw},attack:null};
}

export function applyEnemyDamage(
  enemy:AdventureEnemyState,
  damageRaw:number,
  attackSerial:number,
):{enemy:AdventureEnemyState;damaged:boolean;defeated:boolean}{
  if(enemy.mode==='defeated'||enemy.hp<=0||enemy.lastHitAttackSerial===attackSerial)return {enemy,damaged:false,defeated:enemy.hp<=0};
  const damage=Math.max(0,Math.floor(Number.isFinite(damageRaw)?damageRaw:0));
  if(!damage)return {enemy,damaged:false,defeated:false};
  const hp=Math.max(0,enemy.hp-damage);
  return {
    enemy:{
      ...enemy,
      hp,
      lastHitAttackSerial:attackSerial,
      mode:hp<=0?'defeated':'stagger',
      timer:hp<=0?0:.24,
    },
    damaged:true,
    defeated:hp<=0,
  };
}

export function alertNearbyEnemies(
  enemies:readonly AdventureEnemyState[],
):AdventureEnemyState[]{
  const alerted=enemies.filter(enemy=>['chase','windup','recover','stagger'].includes(enemy.mode)&&enemy.hp>0);
  if(!alerted.length)return [...enemies];
  return enemies.map(enemy=>{
    if(enemy.hp<=0||!['patrol','return'].includes(enemy.mode))return enemy;
    const close=alerted.some(source=>distance2(source.position,enemy.position)<=9);
    return close?{...enemy,mode:'suspicious' as const,timer:.3}:enemy;
  });
}
