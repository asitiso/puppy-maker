import {describe,expect,it} from 'vitest';
import {
  legacyWorldMarkerIds,
  publicProjectIds,
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

  it('exports hydration, derivation and project mutation helpers',async()=>{
    const domain=await import('./generational-world');
    expect(typeof (domain as Record<string,unknown>).emptyGenerationalWorldState).toBe('function');
    expect(typeof (domain as Record<string,unknown>).hydrateGenerationalWorldState).toBe('function');
    expect(typeof (domain as Record<string,unknown>).deriveLegacyWorldMarkers).toBe('function');
    expect(typeof (domain as Record<string,unknown>).startPublicProject).toBe('function');
    expect(typeof (domain as Record<string,unknown>).contributeToPublicProject).toBe('function');
  });
});
