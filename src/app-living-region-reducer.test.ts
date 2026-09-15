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

  it('passes existing game actions through unchanged',()=>{
    const next=appReducer(initialState,{type:'GO',screen:'schedule'});
    expect(next.screen).toBe('schedule');
  });
});
