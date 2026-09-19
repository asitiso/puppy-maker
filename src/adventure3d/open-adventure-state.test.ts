import {describe,expect,it} from 'vitest';
import {
  applyOpenAdventureUpdate,
  dawnreachDiscoveryIds,
  emptyOpenAdventureState,
  hydrateOpenAdventureState,
} from './open-adventure-state';
import {STARTING_FIELD} from './starting-field';

describe('V18 open adventure persistent state',()=>{
  it('starts with a clean current-run exploration state',()=>{
    expect(emptyOpenAdventureState()).toEqual({
      dawnreach:{
        discoveredIds:[],
        echoSenseUnlocked:false,
        campCleared:false,
        ruin:{stonePosition:null,brazierLit:false,solved:false,rewardClaimed:false},
      },
    });
  });

  it('sanitizes malformed discoveries and unsafe positions',()=>{
    const hydrated=hydrateOpenAdventureState({
      dawnreach:{
        discoveredIds:['skywatch','skywatch','nope',42],
        ruin:{stonePosition:{x:999,z:-999},brazierLit:'yes',solved:false,rewardClaimed:false},
      },
    });
    expect(hydrated.dawnreach.discoveredIds).toEqual(['skywatch']);
    expect(hydrated.dawnreach.ruin.stonePosition).toEqual({x:140,z:-140});
    expect(hydrated.dawnreach.ruin.brazierLit).toBe(false);
  });

  it('makes reward ownership imply solved ruins and Echo Sense after hydration',()=>{
    const hydrated=hydrateOpenAdventureState({
      dawnreach:{echoSenseUnlocked:false,ruin:{solved:false,rewardClaimed:true}},
    });
    expect(hydrated.dawnreach.ruin.solved).toBe(true);
    expect(hydrated.dawnreach.echoSenseUnlocked).toBe(true);
  });

  it('keeps discoveries and major accomplishments sticky and idempotent',()=>{
    let state=emptyOpenAdventureState();
    state=applyOpenAdventureUpdate(state,{type:'discover',id:'echo-ruins'});
    state=applyOpenAdventureUpdate(state,{type:'discover',id:'echo-ruins'});
    state=applyOpenAdventureUpdate(state,{type:'clear-camp'});
    state=applyOpenAdventureUpdate(state,{type:'clear-camp'});
    expect(state.dawnreach.discoveredIds).toEqual(['echo-ruins']);
    expect(state.dawnreach.campCleared).toBe(true);
  });

  it('round trips partial ruin progress and makes claimed reward unlock exploration information',()=>{
    let state=emptyOpenAdventureState();
    state=applyOpenAdventureUpdate(state,{
      type:'sync-ruin',
      stonePosition:{x:-57,z:-38},
      brazierLit:true,
      solved:true,
    });
    state=applyOpenAdventureUpdate(state,{type:'sync-ruin',rewardClaimed:true});
    const hydrated=hydrateOpenAdventureState(JSON.parse(JSON.stringify(state)));
    expect(hydrated.dawnreach.ruin).toEqual({
      stonePosition:{x:-57,z:-38},
      brazierLit:true,
      solved:true,
      rewardClaimed:true,
    });
    expect(hydrated.dawnreach.echoSenseUnlocked).toBe(true);
  });

  it('keeps the persistence discovery registry aligned with the authored field',()=>{
    expect([...dawnreachDiscoveryIds].sort()).toEqual(STARTING_FIELD.discoveries.map(item=>item.id).sort());
  });
});
