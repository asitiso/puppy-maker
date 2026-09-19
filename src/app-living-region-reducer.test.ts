import {describe,expect,it} from 'vitest';
import {initialState} from './game';
import {appReducer} from './app-living-region-reducer';

describe('app living region reducer bridge',()=>{
  it('updates only living region persistence without invoking legacy outing rewards',()=>{
    const active=appReducer(initialState,{type:'UPDATE_LIVING_REGION',regionId:'old_shrine',update:{kind:'enter'}});
    expect(active.livingRegions.old_shrine.phase).toBe('active');
    expect(active.gold).toBe(initialState.gold);
    expect(active.explorationXp).toEqual(initialState.explorationXp);

    const started=appReducer(active,{type:'UPDATE_LIVING_REGION',regionId:'old_shrine',update:{kind:'startMainQuest'}});
    expect(started.livingRegions.old_shrine.phase).toBe('mainQuestInProgress');
  });

  it('applies one completed interaction as an atomic persistence batch',()=>{
    const active=appReducer(initialState,{type:'UPDATE_LIVING_REGION',regionId:'herb_hills',update:{kind:'enter'}});
    const next=appReducer(active,{
      type:'UPDATE_LIVING_REGION_BATCH',
      regionId:'herb_hills',
      updates:[
        {kind:'recordInteraction',interactionId:'herb-mira-request'},
        {kind:'recordDiscovery',discoveryId:'opening-request'},
        {kind:'startMainQuest'},
      ],
    });
    expect(next.livingRegions.herb_hills).toEqual({
      phase:'mainQuestInProgress',
      discoveries:['opening-request'],
      completedInteractions:['herb-mira-request'],
    });
    expect(next.gold).toBe(active.gold);
    expect(next.explorationXp).toEqual(active.explorationXp);
  });

  it('updates open-adventure persistence without granting legacy outing rewards',()=>{
    const discovered=appReducer(initialState,{type:'UPDATE_OPEN_ADVENTURE',update:{type:'discover',id:'skywatch'}});
    expect(discovered.openAdventure.dawnreach.discoveredIds).toEqual(['skywatch']);
    expect(discovered.gold).toBe(initialState.gold);
    expect(discovered.explorationXp).toEqual(initialState.explorationXp);

    const cleared=appReducer(discovered,{type:'UPDATE_OPEN_ADVENTURE',update:{type:'clear-camp'}});
    expect(cleared.openAdventure.dawnreach.campCleared).toBe(true);
    expect(cleared.gold).toBe(initialState.gold);
  });

  it('passes existing game actions through unchanged',()=>{
    const next=appReducer(initialState,{type:'GO',screen:'schedule'});
    expect(next.screen).toBe('schedule');
  });
});
