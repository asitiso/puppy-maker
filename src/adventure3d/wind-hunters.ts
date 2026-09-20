import {SKIMMER_HOVER_HEIGHT,type AdventureEnemyState} from './enemy-ai';
import {startingFieldHeight} from './starting-field';
import type {Vec3} from './types';

export const DAWNREACH_WIND_HUNTERS={
  ids:['gale-wing-skywatch','gale-wing-ruins'] as const,
  hoverHeight:SKIMMER_HOVER_HEIGHT,
};

const point=(x:number,z:number):Vec3=>({
  x,
  y:startingFieldHeight(x,z)+SKIMMER_HOVER_HEIGHT,
  z,
});

function hunter(
  id:string,
  label:string,
  x:number,
  z:number,
  patrolPlan:readonly [number,number][],
):AdventureEnemyState{
  const home=point(x,z);
  return {
    id,
    label,
    archetype:'skimmer',
    position:home,
    home,
    patrol:patrolPlan.map(([px,pz])=>point(px,pz)),
    patrolIndex:0,
    hp:46,
    maxHp:46,
    mode:'patrol',
    timer:0,
    facingYaw:0,
    lastHitAttackSerial:-1,
  };
}

export function createDawnreachWindHunters(unlocked:boolean):AdventureEnemyState[]{
  if(!unlocked)return [];
  return [
    hunter(
      'gale-wing-skywatch',
      '돌풍날개',
      -7,
      -54,
      [[-7,-54],[-18,-48],[-28,-42],[-15,-58]],
    ),
    hunter(
      'gale-wing-ruins',
      '돌풍날개',
      -38,
      -33,
      [[-38,-33],[-48,-26],[-55,-18],[-31,-39]],
    ),
  ];
}

export function isDawnreachWindHunter(enemy:AdventureEnemyState|string){
  const id=typeof enemy==='string'?enemy:enemy.id;
  return (DAWNREACH_WIND_HUNTERS.ids as readonly string[]).includes(id);
}

export function mergeDawnreachWindHunters(
  enemies:readonly AdventureEnemyState[],
  unlocked:boolean,
){
  if(!unlocked)return [...enemies];
  const existing=new Set(enemies.map(enemy=>enemy.id));
  return [
    ...enemies,
    ...createDawnreachWindHunters(true).filter(enemy=>!existing.has(enemy.id)),
  ];
}
