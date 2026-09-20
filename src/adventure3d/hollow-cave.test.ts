import {describe,expect,it} from 'vitest';
import {
  HOLLOW_CAVE,
  castHollowCaveWindPulse,
  constrainHollowCavePlayer,
  countActiveHollowCaveResonators,
  createHollowCaveRuntimeState,
  enterHollowCave,
  hollowCaveFieldBoundsRemainValid,
  hollowCaveInsideEntryPosition,
  hollowCaveVisual,
  playerNearHollowCaveEntrance,
  playerNearHollowCaveOutsideShortcut,
} from './hollow-cave';

describe('V18 Hollow Cave exploration loop',()=>{
  it('keeps the hidden cave pocket inside the authored field bounds',()=>{
    expect(hollowCaveFieldBoundsRemainValid()).toBe(true);
    expect(playerNearHollowCaveEntrance({
      x:HOLLOW_CAVE.entrance.x,
      y:0,
      z:HOLLOW_CAVE.entrance.z,
    })).toBe(true);
  });

  it('enters as a transient pocket and constrains movement to the chamber',()=>{
    const state=enterHollowCave(createHollowCaveRuntimeState());
    expect(state.inside).toBe(true);
    const entry=hollowCaveInsideEntryPosition();
    const constrained=constrainHollowCavePlayer({...entry,x:40,z:40});
    expect(Math.hypot(
      constrained.x-HOLLOW_CAVE.chamberCenter.x,
      constrained.z-HOLLOW_CAVE.chamberCenter.z,
    )).toBeLessThanOrEqual(HOLLOW_CAVE.chamberRadius+.001);
  });

  it('opens the shortcut only after all three wind resonators are awakened',()=>{
    let state=enterHollowCave(createHollowCaveRuntimeState());
    const resonators=[
      {x:-93,y:0,z:86},
      {x:-88,y:0,z:81},
      {x:-83,y:0,z:86},
    ];

    for(let index=0;index<resonators.length;index++){
      const result=castHollowCaveWindPulse(state,resonators[index],0);
      state=result.state;
      expect(result.affected).toBe(true);
      expect(countActiveHollowCaveResonators(state)).toBe(index+1);
      expect(result.openedShortcut).toBe(index===resonators.length-1);
    }
    expect(state.shortcutOpen).toBe(true);
  });

  it('does not reopen or duplicate a persisted shortcut',()=>{
    const state=enterHollowCave(createHollowCaveRuntimeState(true));
    const result=castHollowCaveWindPulse(state,{x:-93,y:0,z:86},0);
    expect(result.affected).toBe(false);
    expect(result.openedShortcut).toBe(false);
    expect(result.activatedCount).toBe(3);
  });

  it('exposes a two-way shortcut only after the puzzle is solved',()=>{
    expect(playerNearHollowCaveOutsideShortcut(
      {x:HOLLOW_CAVE.outsideShortcut.x,y:0,z:HOLLOW_CAVE.outsideShortcut.z},
      false,
    )).toBe(false);
    expect(playerNearHollowCaveOutsideShortcut(
      {x:HOLLOW_CAVE.outsideShortcut.x,y:0,z:HOLLOW_CAVE.outsideShortcut.z},
      true,
    )).toBe(true);

    const visual=hollowCaveVisual(
      enterHollowCave(createHollowCaveRuntimeState(true)),
      hollowCaveInsideEntryPosition(),
    );
    expect(visual?.shortcutOpen).toBe(true);
    expect(visual?.resonators.every(item=>item.active)).toBe(true);
  });
});
