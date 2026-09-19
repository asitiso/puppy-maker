import {describe,expect,it} from 'vitest';
import {
  canClaimRuinReward,
  castRuinAbility,
  claimRuinReward,
  createRuinPuzzleState,
  pushRuinStone,
  stepRuinPuzzle,
} from './environment-system';
import {STARTING_RUIN_PUZZLE} from './starting-ruin-puzzle';

const flat=()=>0;

describe('V18 environment interaction puzzle',()=>{
  it('does not solve from a single active plate',()=>{
    let state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    state=stepRuinPuzzle(state,STARTING_RUIN_PUZZLE,STARTING_RUIN_PUZZLE.eastPlate,.016);
    expect(state.eastPlateActive).toBe(true);
    expect(state.westPlateActive).toBe(false);
    expect(state.solved).toBe(false);
  });

  it('supports a physical solution with the stone on one plate and player on the other',()=>{
    let state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    state={...state,stonePosition:{...STARTING_RUIN_PUZZLE.westPlate}};
    state=stepRuinPuzzle(state,STARTING_RUIN_PUZZLE,STARTING_RUIN_PUZZLE.eastPlate,.016);
    expect(state.westPlateActive).toBe(true);
    expect(state.eastPlateActive).toBe(true);
    expect(state.solved).toBe(true);
  });

  it('supports a magic solution with the brazier powering west and player standing east',()=>{
    let state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    const caster={
      x:STARTING_RUIN_PUZZLE.brazier.x,
      y:0,
      z:STARTING_RUIN_PUZZLE.brazier.z+3,
    };
    const cast=castRuinAbility(state,STARTING_RUIN_PUZZLE,'emberSpark',caster,0,flat);
    expect(cast.affected).toBe(true);
    state=stepRuinPuzzle(cast.state,STARTING_RUIN_PUZZLE,STARTING_RUIN_PUZZLE.eastPlate,.016);
    expect(state.brazierLit).toBe(true);
    expect(state.solved).toBe(true);
  });

  it('lets wind pulse reposition the resonance stone at range',()=>{
    const state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    const caster={
      x:state.stonePosition.x,
      y:0,
      z:state.stonePosition.z+5,
    };
    const result=castRuinAbility(state,STARTING_RUIN_PUZZLE,'windPulse',caster,0,flat);
    expect(result.affected).toBe(true);
    expect(result.state.stonePosition.z).toBeLessThan(state.stonePosition.z-3);
    expect(result.state.windPulseFlash).toBeGreaterThan(0);
  });

  it('requires position and facing for environment magic instead of global switch activation',()=>{
    const state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    const far={x:50,y:0,z:50};
    expect(castRuinAbility(state,STARTING_RUIN_PUZZLE,'emberSpark',far,0,flat).affected).toBe(false);
    const wrongFacing={
      x:state.stonePosition.x,
      y:0,
      z:state.stonePosition.z+4,
    };
    expect(castRuinAbility(state,STARTING_RUIN_PUZZLE,'windPulse',wrongFacing,Math.PI,flat).affected).toBe(false);
  });

  it('also allows direct physical pushing when close enough',()=>{
    const state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    const player={x:state.stonePosition.x,y:0,z:state.stonePosition.z+1.5};
    const pushed=pushRuinStone(state,STARTING_RUIN_PUZZLE,player,0,flat);
    expect(pushed.moved).toBe(true);
    expect(pushed.state.stonePosition.z).toBeLessThan(state.stonePosition.z);
  });

  it('gates the exploration reward behind solving and physically reaching the opened core',()=>{
    const state=createRuinPuzzleState(STARTING_RUIN_PUZZLE);
    expect(canClaimRuinReward(state,STARTING_RUIN_PUZZLE,STARTING_RUIN_PUZZLE.reward)).toBe(false);
    const solved={...state,solved:true};
    expect(canClaimRuinReward(solved,STARTING_RUIN_PUZZLE,{x:0,y:0,z:0})).toBe(false);
    expect(canClaimRuinReward(solved,STARTING_RUIN_PUZZLE,STARTING_RUIN_PUZZLE.reward)).toBe(true);
    const claimed=claimRuinReward(solved);
    expect(claimed.rewardClaimed).toBe(true);
    expect(canClaimRuinReward(claimed,STARTING_RUIN_PUZZLE,STARTING_RUIN_PUZZLE.reward)).toBe(false);
  });
});
