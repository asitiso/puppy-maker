import {describe,expect,it} from 'vitest';
import {emptyAdventureWorldState,hydrateAdventureWorldState} from './adventure-world-state';
import {STARTING_FIELD} from './starting-field';

describe('V18 adventure world persistent state',()=>{
  it('starts inert for old saves',()=>{
    expect(hydrateAdventureWorldState(null)).toEqual(emptyAdventureWorldState());
  });

  it('sanitizes malformed coordinates arrays and dependent unlocks',()=>{
    const state=hydrateAdventureWorldState({
      dawnreach:{
        visitedDiscoveries:['echo-ruins','echo-ruins',3],
        lastPosition:{x:9999,z:-9999},
        echoSenseUnlocked:true,
        ruin:{stonePosition:{x:Infinity,z:'bad'},solved:false,rewardClaimed:true,brazierLit:true},
        defeatedEnemyIds:['ash-runner-a','ash-runner-a',null],
        hazards:{grass:{burning:true,spent:true,burnRemaining:999}},
      },
    });
    expect(state.dawnreach.visitedDiscoveries).toEqual(['echo-ruins']);
    expect(state.dawnreach.lastPosition).toEqual({x:STARTING_FIELD.halfSize,z:-STARTING_FIELD.halfSize});
    expect(state.dawnreach.ruin.rewardClaimed).toBe(false);
    expect(state.dawnreach.echoSenseUnlocked).toBe(false);
    expect(state.dawnreach.defeatedEnemyIds).toEqual(['ash-runner-a']);
    expect(state.dawnreach.hazards.grass).toEqual({burning:false,spent:true,burnRemaining:12});
  });

  it('only preserves Echo Sense after a legitimately solved and claimed ruin reward',()=>{
    const state=hydrateAdventureWorldState({
      dawnreach:{
        echoSenseUnlocked:true,
        ruin:{solved:true,rewardClaimed:true},
      },
    });
    expect(state.dawnreach.ruin.solved).toBe(true);
    expect(state.dawnreach.ruin.rewardClaimed).toBe(true);
    expect(state.dawnreach.echoSenseUnlocked).toBe(true);
  });
});
