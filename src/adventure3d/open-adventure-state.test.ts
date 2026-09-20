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
        worldEvents:[],
        hollowCave:{shortcutOpen:false},
        skybreak:{beaconReached:false,windwalkTraces:[]},
        cloudGarden:{restored:false},
        ruin:{stonePosition:null,brazierLit:false,solved:false,rewardClaimed:false},
      },
    });
  });

  it('sanitizes malformed discoveries and unsafe positions',()=>{
    const hydrated=hydrateOpenAdventureState({
      dawnreach:{
        discoveredIds:['skywatch','skywatch','nope',42],
        worldEvents:[
          {id:'roadside-ambush',outcome:'rescued'},
          {id:'roadside-ambush',outcome:'passed'},
          {id:'unknown',outcome:'rescued'},
          {id:'roadside-ambush',outcome:'invalid'},
          {id:'wandering-caravan',outcome:'passed'},
          {id:'wandering-caravan',outcome:'met'},
        ],
        hollowCave:{shortcutOpen:'yes'},
        skybreak:{beaconReached:'yes',windwalkTraces:['sky-thread','sky-thread','bad']},
        cloudGarden:{restored:true},
        ruin:{stonePosition:{x:999,z:-999},brazierLit:'yes',solved:false,rewardClaimed:false},
      },
    });
    expect(hydrated.dawnreach.discoveredIds).toEqual(['skywatch']);
    expect(hydrated.dawnreach.worldEvents).toEqual([{id:'roadside-ambush',outcome:'rescued'},{id:'wandering-caravan',outcome:'met'}]);
    expect(hydrated.dawnreach.ruin.stonePosition).toEqual({x:140,z:-140});
    expect(hydrated.dawnreach.ruin.brazierLit).toBe(false);
    expect(hydrated.dawnreach.hollowCave.shortcutOpen).toBe(false);
    expect(hydrated.dawnreach.skybreak.beaconReached).toBe(false);
    expect(hydrated.dawnreach.skybreak.windwalkTraces).toEqual([]);
    expect(hydrated.dawnreach.cloudGarden.restored).toBe(false);
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
    state=applyOpenAdventureUpdate(state,{type:'resolve-world-event',id:'roadside-ambush',outcome:'rescued'});
    state=applyOpenAdventureUpdate(state,{type:'resolve-world-event',id:'roadside-ambush',outcome:'passed'});
    state=applyOpenAdventureUpdate(state,{type:'resolve-world-event',id:'wandering-caravan',outcome:'met'});
    expect(state.dawnreach.worldEvents).toEqual([
      {id:'roadside-ambush',outcome:'rescued'},
      {id:'wandering-caravan',outcome:'met'},
    ]);
  });

  it('persists the Hollow Cave shortcut as a sticky major exploration result',()=>{
    let state=emptyOpenAdventureState();
    state=applyOpenAdventureUpdate(state,{type:'open-hollow-shortcut'});
    expect(state.dawnreach.hollowCave.shortcutOpen).toBe(true);
    expect(state.dawnreach.discoveredIds).toContain('hollow-cave');
    expect(applyOpenAdventureUpdate(state,{type:'open-hollow-shortcut'})).toBe(state);

    const hydrated=hydrateOpenAdventureState({
      dawnreach:{hollowCave:{shortcutOpen:true}},
    });
    expect(hydrated.dawnreach.hollowCave.shortcutOpen).toBe(true);
    expect(hydrated.dawnreach.discoveredIds).toContain('hollow-cave');
  });

  it('persists the Skybreak beacon as a sticky exploration-network result',()=>{
    let state=emptyOpenAdventureState();
    state=applyOpenAdventureUpdate(state,{type:'reach-skybreak-beacon'});
    expect(state.dawnreach.skybreak.beaconReached).toBe(true);
    expect(applyOpenAdventureUpdate(state,{type:'reach-skybreak-beacon'})).toBe(state);

    const hydrated=hydrateOpenAdventureState({
      dawnreach:{skybreak:{beaconReached:true}},
    });
    expect(hydrated.dawnreach.skybreak.beaconReached).toBe(true);
  });

  it('hydrates valid Windwalk traces only for a completed beacon route',()=>{
    const hydrated=hydrateOpenAdventureState({
      dawnreach:{skybreak:{beaconReached:true,windwalkTraces:['sky-thread','bad','sky-thread','west-aerie']}},
    });
    expect(hydrated.dawnreach.skybreak.windwalkTraces).toEqual(['sky-thread','west-aerie']);
  });

  it('persists Windwalk aerial traces only after the beacon unlock',()=>{
    let locked=emptyOpenAdventureState();
    expect(applyOpenAdventureUpdate(locked,{type:'discover-windwalk-trace',id:'sky-thread'})).toBe(locked);

    let state=applyOpenAdventureUpdate(locked,{type:'reach-skybreak-beacon'});
    state=applyOpenAdventureUpdate(state,{type:'discover-windwalk-trace',id:'sky-thread'});
    state=applyOpenAdventureUpdate(state,{type:'discover-windwalk-trace',id:'sky-thread'});
    state=applyOpenAdventureUpdate(state,{type:'discover-windwalk-trace',id:'ruin-crown'});
    expect(state.dawnreach.skybreak.windwalkTraces).toEqual(['sky-thread','ruin-crown']);
  });

  it('restores Cloud Garden only after all three Windwalk traces and keeps it sticky',()=>{
    let state=emptyOpenAdventureState();
    expect(applyOpenAdventureUpdate(state,{type:'restore-cloud-garden'})).toBe(state);
    state=applyOpenAdventureUpdate(state,{type:'reach-skybreak-beacon'});
    for(const id of ['sky-thread','ruin-crown','west-aerie'] as const){
      state=applyOpenAdventureUpdate(state,{type:'discover-windwalk-trace',id});
    }
    state=applyOpenAdventureUpdate(state,{type:'restore-cloud-garden'});
    expect(state.dawnreach.cloudGarden.restored).toBe(true);
    expect(applyOpenAdventureUpdate(state,{type:'restore-cloud-garden'})).toBe(state);

    const hydrated=hydrateOpenAdventureState(JSON.parse(JSON.stringify(state)));
    expect(hydrated.dawnreach.cloudGarden.restored).toBe(true);
  });

  it('drops impossible restored garden saves without a completed aerial route',()=>{
    const hydrated=hydrateOpenAdventureState({
      dawnreach:{
        skybreak:{beaconReached:true,windwalkTraces:['sky-thread']},
        cloudGarden:{restored:true},
      },
    });
    expect(hydrated.dawnreach.cloudGarden.restored).toBe(false);
  });

  it('keeps no-op updates referentially stable to avoid redundant production writes',()=>{
    const state=applyOpenAdventureUpdate(emptyOpenAdventureState(),{type:'discover',id:'skywatch'});
    expect(applyOpenAdventureUpdate(state,{type:'discover',id:'skywatch'})).toBe(state);
    const cleared=applyOpenAdventureUpdate(state,{type:'clear-camp'});
    expect(applyOpenAdventureUpdate(cleared,{type:'clear-camp'})).toBe(cleared);
    const resolved=applyOpenAdventureUpdate(cleared,{type:'resolve-world-event',id:'roadside-ambush',outcome:'passed'});
    expect(applyOpenAdventureUpdate(resolved,{type:'resolve-world-event',id:'roadside-ambush',outcome:'rescued'})).toBe(resolved);
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
