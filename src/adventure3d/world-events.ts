import {startingFieldHeight} from './starting-field';
import type {AdventureEnemyState,EnemyArchetype} from './enemy-ai';
import type {Vec3} from './types';

export const dawnreachWorldEventIds=['roadside-ambush','wandering-caravan'] as const;
export type DawnreachWorldEventId=typeof dawnreachWorldEventIds[number];

export const dawnreachWorldEventOutcomes=['rescued','passed','met'] as const;
export type DawnreachWorldEventOutcome=typeof dawnreachWorldEventOutcomes[number];

export type WorldEventPhase='hidden'|'witnessed'|'intervening'|'resolved';

export type WorldEventVisual={
  id:DawnreachWorldEventId;
  label:string;
  position:Vec3;
  phase:Exclude<WorldEventPhase,'hidden'|'resolved'>;
};

export type WorldConsequenceKind='rescued-traveler'|'abandoned-supplies';

export type WorldConsequenceVisual={
  id:DawnreachWorldEventId;
  kind:WorldConsequenceKind;
  label:string;
  position:Vec3;
  interactionRadius:number;
};

const validWorldEventOutcomes:Record<DawnreachWorldEventId,ReadonlySet<DawnreachWorldEventOutcome>>={
  'roadside-ambush':new Set<DawnreachWorldEventOutcome>(['rescued','passed']),
  'wandering-caravan':new Set<DawnreachWorldEventOutcome>(['met']),
};

export function isValidDawnreachWorldEventResolution(
  id:string,
  outcome:string,
):id is DawnreachWorldEventId{
  return dawnreachWorldEventIds.includes(id as DawnreachWorldEventId)&&
    dawnreachWorldEventOutcomes.includes(outcome as DawnreachWorldEventOutcome)&&
    validWorldEventOutcomes[id as DawnreachWorldEventId].has(outcome as DawnreachWorldEventOutcome);
}

export const ROADSIDE_AMBUSH={
  id:'roadside-ambush' as const,
  label:'길목 습격',
  position:{x:-42,z:18},
  witnessRadius:18,
  interactRadius:11,
};

const roadsideEnemyIds=['roadside-raider-a','roadside-raider-b'] as const;
const roadsideEnemySet=new Set<string>(roadsideEnemyIds);

function point(x:number,z:number):Vec3{
  return {x,y:startingFieldHeight(x,z),z};
}

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
    mode:'chase',
    timer:0,
    facingYaw:0,
    lastHitAttackSerial:-1,
  };
}

export function createRoadsideAmbushEnemies():AdventureEnemyState[]{
  return [
    enemy('roadside-raider-a','길목 습격자','rusher',-46,16,38,[point(-46,16),point(-39,13),point(-42,21)]),
    enemy('roadside-raider-b','길목 약탈자','guard',-38,20,54,[point(-38,20),point(-44,23),point(-35,16)]),
  ];
}

export function isRoadsideAmbushEnemy(enemy:AdventureEnemyState|string):boolean{
  return roadsideEnemySet.has(typeof enemy==='string'?enemy:enemy.id);
}

export function shouldWitnessRoadsideAmbush(player:Vec3,resolved:boolean):boolean{
  if(resolved)return false;
  return Math.hypot(
    player.x-ROADSIDE_AMBUSH.position.x,
    player.z-ROADSIDE_AMBUSH.position.z,
  )<=ROADSIDE_AMBUSH.witnessRadius;
}

export function playerNearRoadsideAmbush(player:Vec3):boolean{
  return Math.hypot(
    player.x-ROADSIDE_AMBUSH.position.x,
    player.z-ROADSIDE_AMBUSH.position.z,
  )<=ROADSIDE_AMBUSH.interactRadius;
}

export function roadsideAmbushDefeated(enemies:readonly AdventureEnemyState[]):boolean{
  const participants=enemies.filter(enemy=>isRoadsideAmbushEnemy(enemy));
  return participants.length===roadsideEnemyIds.length&&participants.every(enemy=>enemy.hp<=0||enemy.mode==='defeated');
}

export function roadsideAmbushVisual(phase:WorldEventPhase):WorldEventVisual|null{
  if(phase!=='witnessed'&&phase!=='intervening')return null;
  return {
    id:ROADSIDE_AMBUSH.id,
    label:ROADSIDE_AMBUSH.label,
    position:point(ROADSIDE_AMBUSH.position.x,ROADSIDE_AMBUSH.position.z),
    phase,
  };
}

export function roadsideAmbushConsequence(outcome:DawnreachWorldEventOutcome|undefined):WorldConsequenceVisual|null{
  if(!outcome)return null;
  const rescued=outcome==='rescued';
  const x=rescued?ROADSIDE_AMBUSH.position.x+1.8:ROADSIDE_AMBUSH.position.x-.8;
  const z=rescued?ROADSIDE_AMBUSH.position.z+1.2:ROADSIDE_AMBUSH.position.z+.5;
  return {
    id:ROADSIDE_AMBUSH.id,
    kind:rescued?'rescued-traveler':'abandoned-supplies',
    label:rescued?'구조된 여행자':'버려진 짐',
    position:point(x,z),
    interactionRadius:rescued?5.5:5,
  };
}

export function playerNearWorldConsequence(
  player:Vec3,
  consequence:WorldConsequenceVisual|null,
):boolean{
  if(!consequence)return false;
  return Math.hypot(
    player.x-consequence.position.x,
    player.z-consequence.position.z,
  )<=consequence.interactionRadius;
}

export function roadsideConsequenceMessage(kind:WorldConsequenceKind):string{
  return kind==='rescued-traveler'
    ?'여행자: “고마워요. 서쪽 달이끼 군락 너머 바위에서 찬 바람이 새어 나와요. 평범한 절벽은 아닌 것 같았어요.”'
    :'찢어진 짐자루와 깊게 패인 바퀴 자국만 남아 있습니다. 습격자들은 재빛 야영지 쪽으로 물러난 흔적을 남겼습니다.';
}
