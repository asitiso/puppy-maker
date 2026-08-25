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
});
