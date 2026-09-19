import {describe,expect,it} from 'vitest';
import {STARTING_FIELD} from './starting-field';
import {STARTING_RUIN_PUZZLE} from './starting-ruin-puzzle';

describe('V18 Echo Ruins puzzle placement',()=>{
  it('lives inside the same world space as the visible ruin landmark',()=>{
    const ruin=STARTING_FIELD.discoveries.find(item=>item.id==='echo-ruins')!;
    expect(Math.hypot(
      STARTING_RUIN_PUZZLE.center.x-ruin.position.x,
      STARTING_RUIN_PUZZLE.center.z-ruin.position.z,
    )).toBeLessThan(1);
  });

  it('spreads interactables enough to require repositioning instead of one-button solving',()=>{
    expect(Math.hypot(
      STARTING_RUIN_PUZZLE.westPlate.x-STARTING_RUIN_PUZZLE.eastPlate.x,
      STARTING_RUIN_PUZZLE.westPlate.z-STARTING_RUIN_PUZZLE.eastPlate.z,
    )).toBeGreaterThan(8);
    expect(Math.hypot(
      STARTING_RUIN_PUZZLE.stoneStart.x-STARTING_RUIN_PUZZLE.westPlate.x,
      STARTING_RUIN_PUZZLE.stoneStart.z-STARTING_RUIN_PUZZLE.westPlate.z,
    )).toBeGreaterThan(8);
  });
});
