import {describe,expect,it} from 'vitest';
import {emptyCampaignRunState} from './campaign-state';
import {emptyAdventureWorldState} from './adventure3d/adventure-world-state';
import {emptyCharacterBondsState} from './character-bonds';
import {emptyLivingRegionState} from './exploration/living-region-state';
import {emptyLegacyState} from './legacy-state';
import {emptyV3PersistentState,hydrateV3PersistentState,pickV3PersistentState,prepareNewRunState} from './v3-persistent-state';

describe('V3 persistent composition',()=>{
  it('starts with inert nested slices',()=>{
    const state=emptyV3PersistentState();
    expect(state.campaignRun).toEqual(emptyCampaignRunState());
    expect(state.characterBonds).toEqual(emptyCharacterBondsState());
    expect(state.worldHistory).toEqual({currentFacts:[],inheritedFacts:[]});
    expect(state.legacy).toEqual(emptyLegacyState());
    expect(state.livingRegions).toEqual(emptyLivingRegionState());
    expect(state.adventureWorld).toEqual(emptyAdventureWorldState());
  });

  it('seeds legacy ending history from V2 top-level endingCollection when legacy is absent',()=>{
    const state=hydrateV3PersistentState({endingCollection:['guardian','guardian','scholar']});
    expect(state.legacy.endingCollection).toEqual(['guardian','scholar']);
  });

  it('prefers an explicit V3 legacy object over the V2 seed',()=>{
    const state=hydrateV3PersistentState({endingCollection:['old'],legacy:{endingCollection:['v3']}});
    expect(state.legacy.endingCollection).toEqual(['v3']);
  });

  it('hydrates old saves without V16 data to safe living-region defaults',()=>{
    const state=hydrateV3PersistentState({campaignRun:emptyCampaignRunState()});
    expect(state.livingRegions).toEqual(emptyLivingRegionState());
  });

  it('sanitizes malformed V16 living-region data while hydrating',()=>{
    const state=hydrateV3PersistentState({
      livingRegions:{
        old_shrine:{phase:'mainQuestResolved',discoveries:['seal','seal',3],completedInteractions:['altar']},
        herb_hills:{phase:'invalid'},
      },
    });
    expect(state.livingRegions.old_shrine).toEqual({
      phase:'mainQuestResolved',
      discoveries:['seal'],
      completedInteractions:['altar'],
    });
    expect(state.livingRegions.herb_hills).toEqual({phase:'unvisited',discoveries:[],completedInteractions:[]});
    expect(state.livingRegions.expedition_outpost).toEqual({phase:'unvisited',discoveries:[],completedInteractions:[]});
  });

  it('picks a sanitized living-region slice for persistence',()=>{
    const picked=pickV3PersistentState({
      ...emptyV3PersistentState(),
      livingRegions:{
        old_shrine:{phase:'postResolution',discoveries:['seal','seal'],completedInteractions:['altar','altar']},
        herb_hills:{phase:'active',discoveries:[],completedInteractions:[]},
        expedition_outpost:{phase:'unvisited',discoveries:[],completedInteractions:[]},
      },
    } as Parameters<typeof pickV3PersistentState>[0]);
    expect(picked.livingRegions.old_shrine).toEqual({
      phase:'postResolution',
      discoveries:['seal'],
      completedInteractions:['altar'],
    });
    expect(picked.livingRegions.herb_hills.phase).toBe('active');
  });

  it('prepares but does not activate a clean future run boundary',()=>{
    const current={
      ...emptyV3PersistentState(),
      worldHistory:{currentFacts:['rift_unstable' as const],inheritedFacts:[]},
      legacy:{...emptyLegacyState(),legacyWorldFacts:['regional_alliance' as const]},
      livingRegions:{
        ...emptyLivingRegionState(),
        old_shrine:{phase:'postResolution' as const,discoveries:['seal'],completedInteractions:['altar']},
      },
    };
    const next=prepareNewRunState(current);
    expect(next.campaignRun).toEqual(emptyCampaignRunState());
    expect(next.characterBonds).toEqual(emptyCharacterBondsState());
    expect(next.worldHistory).toEqual({currentFacts:[],inheritedFacts:['regional_alliance']});
    expect(next.legacy).toEqual(current.legacy);
    expect(next.livingRegions).toEqual(emptyLivingRegionState());
    expect(next.adventureWorld).toEqual(emptyAdventureWorldState());
  });
});
