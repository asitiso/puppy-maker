import {describe,expect,it} from 'vitest';
import {
  contributeToPublicProject,
  deriveLegacyWorldMarkers,
  emptyGenerationalWorldState,
  hydrateGenerationalWorldState,
  legacyWorldMarkerIds,
  publicProjectIds,
  startPublicProject,
  type GenerationalWorldState,
} from './generational-world';

describe('V6 generational world domain contract',()=>{
  it('declares canonical bounded legacy markers and public projects in one domain module',()=>{
    expect(legacyWorldMarkerIds).toEqual([
      'festival_tradition',
      'open_road_network',
      'regional_compact',
      'restored_riftward',
      'forbidden_legacy',
      'hollow_scar',
    ]);
    expect(publicProjectIds).toEqual([
      'guardian_academy',
      'ancient_road_restoration',
      'regional_council',
      'rift_watch',
    ]);
    const state:GenerationalWorldState={legacyMarkers:[],activeProject:null,projectProgress:0,completedProjects:[]};
    expect(state.projectProgress).toBe(0);
  });

  it('hydrates malformed state to canonical registry order and finite bounded progress',()=>{
    expect(hydrateGenerationalWorldState({
      legacyMarkers:['hollow_scar','bad','festival_tradition','hollow_scar'],
      activeProject:'guardian_academy',
      projectProgress:Number.POSITIVE_INFINITY,
      completedProjects:['regional_council','bad','regional_council'],
    })).toEqual({
      legacyMarkers:['festival_tradition','hollow_scar'],
      activeProject:'guardian_academy',
      projectProgress:0,
      completedProjects:['regional_council'],
    });

    expect(hydrateGenerationalWorldState({
      activeProject:'regional_council',
      projectProgress:88,
      completedProjects:['regional_council'],
    })).toEqual({legacyMarkers:[],activeProject:null,projectProgress:0,completedProjects:['regional_council']});
  });

  it('derives legacy markers deterministically from ancestor and inherited World Facts',()=>{
    expect(deriveLegacyWorldMarkers({
      ancestors:[
        {majorWorldFacts:['festival_saved','hollow_rift_entrenched']},
        {majorWorldFacts:['festival_saved','bad']},
      ],
      inheritedFacts:['regional_alliance','rift_stabilized','regional_alliance'],
    })).toEqual(['festival_tradition','regional_compact','restored_riftward','hollow_scar']);
  });

  it('starts one unfinished project and completes it at 100 without duplicate records',()=>{
    const started=startPublicProject(emptyGenerationalWorldState(),'guardian_academy');
    expect(started).toEqual({legacyMarkers:[],activeProject:'guardian_academy',projectProgress:0,completedProjects:[]});

    const ninety=contributeToPublicProject(started,90);
    expect(ninety.projectProgress).toBe(90);

    const complete=contributeToPublicProject(ninety,15);
    expect(complete).toEqual({legacyMarkers:[],activeProject:null,projectProgress:0,completedProjects:['guardian_academy']});
    expect(contributeToPublicProject(complete,10)).toBe(complete);
    expect(startPublicProject(complete,'guardian_academy')).toBe(complete);
  });
});
