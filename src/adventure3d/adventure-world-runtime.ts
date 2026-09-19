import type {AdventureEnemyState} from './enemy-ai';
import type {FieldHazardState} from './environment-combat';
import {createRuinPuzzleState,type RuinPuzzleState} from './environment-system';
import {createStartingCampEnemies} from './starting-encounter';
import {createStartingCampHazards} from './starting-hazards';
import {STARTING_FIELD,startingFieldHeight} from './starting-field';
import {STARTING_RUIN_PUZZLE} from './starting-ruin-puzzle';
import type {PlayerMotionState,Vec3} from './types';
import {hydrateAdventureWorldState,type AdventureWorldState,type DawnreachAdventureState} from './adventure-world-state';

export type RestoredDawnreachRuntime={
  position:Vec3;
  visitedDiscoveries:Set<string>;
  echoSenseUnlocked:boolean;
  ruinPuzzle:RuinPuzzleState;
  enemies:AdventureEnemyState[];
  hazards:FieldHazardState[];
};

export function restoreDawnreachRuntime(savedRaw:unknown):RestoredDawnreachRuntime{
  const saved=hydrateAdventureWorldState({version:1,dawnreach:savedRaw}).dawnreach;
  const position=saved.lastPosition
    ?{x:saved.lastPosition.x,y:startingFieldHeight(saved.lastPosition.x,saved.lastPosition.z),z:saved.lastPosition.z}
    :{...STARTING_FIELD.spawn,y:startingFieldHeight(STARTING_FIELD.spawn.x,STARTING_FIELD.spawn.z)};

  const ruinBase=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
  const ruinPuzzle:RuinPuzzleState={
    ...ruinBase,
    stonePosition:{
      x:saved.ruin.stonePosition.x,
      y:startingFieldHeight(saved.ruin.stonePosition.x,saved.ruin.stonePosition.z),
      z:saved.ruin.stonePosition.z,
    },
    brazierLit:saved.ruin.brazierLit,
    solved:saved.ruin.solved,
    rewardClaimed:saved.ruin.rewardClaimed,
  };

  const defeated=new Set(saved.defeatedEnemyIds);
  const enemies=createStartingCampEnemies().map(enemy=>defeated.has(enemy.id)
    ?{...enemy,hp:0,mode:'defeated' as const,timer:0}
    :enemy);

  const hazards=createStartingCampHazards().map(hazard=>{
    const persisted=saved.hazards[hazard.id];
    if(!persisted)return hazard;
    return {
      ...hazard,
      burning:persisted.burning&&!persisted.spent&&persisted.burnRemaining>0,
      spent:persisted.spent,
      burnRemaining:persisted.spent?0:persisted.burnRemaining,
      pulseClock:0,
    };
  });

  return {
    position,
    visitedDiscoveries:new Set(saved.visitedDiscoveries),
    echoSenseUnlocked:saved.echoSenseUnlocked,
    ruinPuzzle,
    enemies,
    hazards,
  };
}

export function snapshotDawnreachRuntime(input:{
  player:PlayerMotionState;
  visitedDiscoveries:ReadonlySet<string>;
  echoSenseUnlocked:boolean;
  ruinPuzzle:RuinPuzzleState;
  enemies:readonly AdventureEnemyState[];
  hazards:readonly FieldHazardState[];
}):AdventureWorldState{
  const hazards:Record<string,{burning:boolean;spent:boolean;burnRemaining:number}>={};
  for(const hazard of input.hazards){
    hazards[hazard.id]={
      burning:hazard.burning,
      spent:hazard.spent,
      burnRemaining:hazard.burnRemaining,
    };
  }

  const dawnreach:DawnreachAdventureState={
    visitedDiscoveries:[...input.visitedDiscoveries].sort(),
    lastPosition:{x:input.player.position.x,z:input.player.position.z},
    echoSenseUnlocked:input.echoSenseUnlocked,
    ruin:{
      stonePosition:{x:input.ruinPuzzle.stonePosition.x,z:input.ruinPuzzle.stonePosition.z},
      brazierLit:input.ruinPuzzle.brazierLit,
      solved:input.ruinPuzzle.solved,
      rewardClaimed:input.ruinPuzzle.rewardClaimed,
    },
    defeatedEnemyIds:input.enemies.filter(enemy=>enemy.hp<=0||enemy.mode==='defeated').map(enemy=>enemy.id).sort(),
    hazards,
  };

  return hydrateAdventureWorldState({version:1,dawnreach});
}
