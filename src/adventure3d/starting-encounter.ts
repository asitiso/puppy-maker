import {startingFieldHeight} from './starting-field';
import type {AdventureEnemyState,EnemyArchetype} from './enemy-ai';
import type {Vec3} from './types';

function point(x:number,z:number):Vec3{return {x,y:startingFieldHeight(x,z),z};}

function enemy(
  id:string,
  label:string,
  archetype:EnemyArchetype,
  x:number,
  z:number,
  hp:number,
  patrol:readonly Vec3[],
):AdventureEnemyState{
  const home=point(x,z);
  return {
    id,label,archetype,
    position:home,
    home,
    patrol,
    patrolIndex:0,
    hp,maxHp:hp,
    mode:'patrol',
    timer:0,
    facingYaw:0,
    lastHitAttackSerial:-1,
  };
}

export function createStartingCampEnemies():AdventureEnemyState[]{
  return [
    enemy('ash-runner-a','재빛 추적자','rusher',44,-34,42,[point(44,-34),point(53,-31),point(55,-42)]),
    enemy('ash-runner-b','재빛 추적자','rusher',57,-43,42,[point(57,-43),point(48,-47),point(45,-38)]),
    enemy('ash-warden','재빛 파수꾼','guard',50,-50,64,[point(50,-50),point(58,-48),point(54,-38)]),
  ];
}
