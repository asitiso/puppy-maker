import {describe,expect,it} from 'vitest';
import {outingLocationIds} from '../adventure';
import {livingRegionExplorationBuilders} from './living-region-explorations';
import {emptyLivingRegionState} from './living-region-state';
import {outingCrossroadsWorld} from './outing-crossroads';
import {LEGACY_REGION_IDS,LIVING_REGION_IDS,REGION_IDS,regionRegistry} from './region-registry';

describe('V16 region registry cross-module routing contract',()=>{
  it('keeps legacy adventure progression aligned with registry legacy ids',()=>{
    expect([...LEGACY_REGION_IDS]).toEqual([...outingLocationIds]);
  });

  it('keeps living persistence and exploration builders aligned with registry living ids',()=>{
    expect(Object.keys(emptyLivingRegionState())).toEqual([...LIVING_REGION_IDS]);
    expect(Object.keys(livingRegionExplorationBuilders)).toEqual([...LIVING_REGION_IDS]);
  });

  it('keeps every registry region reachable through exactly one crossroads portal',()=>{
    const portals=outingCrossroadsWorld.interactables.filter(item=>item.kind==='portal');
    expect(portals.map(item=>item.destinationId)).toEqual([...REGION_IDS]);
    expect(new Set(portals.map(item=>item.destinationId)).size).toBe(REGION_IDS.length);
  });

  it('keeps generation metadata consistent with the canonical partitions',()=>{
    for(const id of LEGACY_REGION_IDS)expect(regionRegistry[id].generation).toBe('legacy');
    for(const id of LIVING_REGION_IDS)expect(regionRegistry[id].generation).toBe('living');
  });
});
