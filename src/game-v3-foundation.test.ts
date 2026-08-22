import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer} from './game';
import {emptyCampaignRunState} from './campaign-state';
import {emptyCharacterBondsState} from './character-bonds';
import {emptyLegacyState} from './legacy-state';
import {emptyWorldHistoryState} from './world-history';

describe('V3 foundation GameState integration',()=>{
  it('mounts safe V3 defaults in the canonical game state',()=>{
    expect(initialState.campaignRun).toEqual(emptyCampaignRunState());
    expect(initialState.worldHistory).toEqual(emptyWorldHistoryState());
    expect(initialState.characterBonds).toEqual(emptyCharacterBondsState());
    expect(initialState.legacy).toEqual(emptyLegacyState());
  });

  it('hydrates malformed nested V3 state safely',()=>{
    const state=hydrateGameState({
      ...initialState,
      campaignRun:{runNumber:-2,activeCampaign:'stale'},
      worldHistory:{currentFacts:['stale']},
      characterBonds:{mira:{trust:Infinity,memories:['stale']}},
      legacy:{completedRuns:Infinity,completedCampaigns:['stale']},
    });
    expect(state.campaignRun).toEqual(emptyCampaignRunState());
    expect(state.worldHistory).toEqual(emptyWorldHistoryState());
    expect(state.characterBonds.mira.trust).toBe(0);
    expect(state.legacy.completedRuns).toBe(0);
  });

  it('preserves V3 slices across existing reducer actions',()=>{
    const state={...initialState,campaignRun:{...initialState.campaignRun,runNumber:3}};
    const next=reducer(state,{type:'SET_TACTICAL_PREFERENCES',auto:true,speed:2});
    expect(next.campaignRun.runNumber).toBe(3);
  });

  it('keeps top-level NEW_RUN inert during Foundation',()=>{
    const state={...initialState,campaignRun:{...initialState.campaignRun,runNumber:3}};
    expect(reducer(state,{type:'NEW_RUN'})).toBe(state);
  });

  it('RESET restores V3 defaults',()=>{
    const state={...initialState,campaignRun:{...initialState.campaignRun,runNumber:3}};
    expect(reducer(state,{type:'RESET'}).campaignRun).toEqual(emptyCampaignRunState());
  });
});
