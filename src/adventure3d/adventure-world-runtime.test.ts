import {describe,expect,it} from 'vitest';
import {DEFAULT_PLAYER_STATE} from './player-controller';
import {createRuinPuzzleState} from './environment-system';
import {createStartingCampEnemies} from './starting-encounter';
import {createStartingCampHazards} from './starting-hazards';
import {STARTING_RUIN_PUZZLE} from './starting-ruin-puzzle';
import {restoreDawnreachRuntime,snapshotDawnreachRuntime} from './adventure-world-runtime';

describe('V18 Dawnreach runtime persistence adapter',()=>{
  it('round trips meaningful world changes without serializing transient combat clocks',()=>{
    const enemies=createStartingCampEnemies();
    enemies[0]={...enemies[0],hp:0,mode:'defeated'};
    const hazards=createStartingCampHazards();
    hazards[1]={...hazards[1],burning:false,spent:true,burnRemaining:0};
    const puzzle={
      ...createRuinPuzzleState(STARTING_RUIN_PUZZLE),
      solved:true,
      rewardClaimed:true,
      brazierLit:true,
      stonePosition:{...STARTING_RUIN_PUZZLE.westPlate},
    };
    const snapshot=snapshotDawnreachRuntime({
      player:{...DEFAULT_PLAYER_STATE,position:{x:-20,y:3,z:-12}},
      visitedDiscoveries:new Set(['echo-ruins','wind-crystal']),
      echoSenseUnlocked:true,
      ruinPuzzle:puzzle,
      enemies,
      hazards,
    });
    const restored=restoreDawnreachRuntime(snapshot.dawnreach);
    expect(restored.position.x).toBe(-20);
    expect(restored.position.z).toBe(-12);
    expect([...restored.visitedDiscoveries].sort()).toEqual(['echo-ruins','wind-crystal']);
    expect(restored.echoSenseUnlocked).toBe(true);
    expect(restored.ruinPuzzle.solved).toBe(true);
    expect(restored.ruinPuzzle.rewardClaimed).toBe(true);
    expect(restored.enemies.find(enemy=>enemy.id===enemies[0].id)?.mode).toBe('defeated');
    expect(restored.hazards.find(hazard=>hazard.id===hazards[1].id)?.spent).toBe(true);
  });

  it('restores living enemies from authored defaults instead of persisting temporary damage',()=>{
    const enemies=createStartingCampEnemies();
    enemies[0]={...enemies[0],hp:5,mode:'stagger',timer:.2};
    const snapshot=snapshotDawnreachRuntime({
      player:DEFAULT_PLAYER_STATE,
      visitedDiscoveries:new Set(),
      echoSenseUnlocked:false,
      ruinPuzzle:createRuinPuzzleState(STARTING_RUIN_PUZZLE),
      enemies,
      hazards:createStartingCampHazards(),
    });
    const restored=restoreDawnreachRuntime(snapshot.dawnreach);
    const enemy=restored.enemies.find(item=>item.id===enemies[0].id)!;
    expect(enemy.hp).toBe(enemy.maxHp);
    expect(enemy.mode).toBe('patrol');
  });
});
