import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {emptyCharacterBondsState} from './character-bonds';
import {emptyLegacyState} from './legacy-state';
import {emptyV3PersistentState,hydrateV3PersistentState,prepareNewRunState} from './v3-persistent-state';

describe('V3 persistent composition',()=>{
  it('starts with four inert nested slices',()=>{
    const state=emptyV3PersistentState();
    expect(state.campaignRun).toEqual(emptyCampaignRunState());
    expect(state.characterBonds).toEqual(emptyCharacterBondsState());
    expect(state.worldHistory).toEqual({currentFacts:[],inheritedFacts:[]});
    expect(state.legacy).toEqual(emptyLegacyState());
  });

  it('seeds legacy ending history from V2 top-level endingCollection when legacy is absent',()=>{
    const state=hydrateV3PersistentState({endingCollection:['guardian','guardian','scholar']});
    expect(state.legacy.endingCollection).toEqual(['guardian','scholar']);
  });

  it('prefers an explicit V3 legacy object over the V2 seed',()=>{
    const state=hydrateV3PersistentState({endingCollection:['old'],legacy:{endingCollection:['v3']}});
    expect(state.legacy.endingCollection).toEqual(['v3']);
  });

  it('prepares but does not activate a clean future run boundary',()=>{
    const current={...emptyV3PersistentState(),worldHistory:{currentFacts:['rift_unstable' as const],inheritedFacts:[]},legacy:{...emptyLegacyState(),legacyWorldFacts:['regional_alliance' as const]}};
    const next=prepareNewRunState(current);
    expect(next.campaignRun).toEqual(emptyCampaignRunState());
    expect(next.characterBonds).toEqual(emptyCharacterBondsState());
    expect(next.worldHistory).toEqual({currentFacts:[],inheritedFacts:['regional_alliance']});
    expect(next.legacy).toEqual(current.legacy);
  });
});
