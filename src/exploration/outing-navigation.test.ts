import {describe,expect,it} from 'vitest';
import {LEGACY_REGION_IDS,LIVING_REGION_IDS,REGION_IDS,getRegionDefinition} from './region-registry';
import {getOutingRoute,getOutingSceneTitle,parseOutingDestination} from './outing-navigation';

describe('canonical outing navigation',()=>{
  it('accepts every registry region and rejects unknown portal destinations',()=>{
    for(const id of REGION_IDS)expect(parseOutingDestination(id)).toBe(id);
    expect(parseOutingDestination('unfinished-region')).toBeNull();
    expect(parseOutingDestination('crossroads')).toBeNull();
  });

  it('classifies every scene from the canonical region registry',()=>{
    expect(getOutingRoute('crossroads')).toEqual({kind:'crossroads'});
    for(const id of LEGACY_REGION_IDS)expect(getOutingRoute(id)).toEqual({kind:'legacy',regionId:id});
    for(const id of LIVING_REGION_IDS)expect(getOutingRoute(id)).toEqual({kind:'living',regionId:id});
  });

  it('gets every destination title from the same registry metadata',()=>{
    expect(getOutingSceneTitle('crossroads','여행자 교차로')).toBe('여행자 교차로');
    for(const id of REGION_IDS){
      expect(getOutingSceneTitle(id,'여행자 교차로')).toBe(getRegionDefinition(id).name);
    }
  });
});
