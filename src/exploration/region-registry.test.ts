import {describe,expect,it} from 'vitest';
import {
  LEGACY_REGION_IDS,
  LIVING_REGION_IDS,
  REGION_IDS,
  getRegionDefinition,
  regionRegistry,
} from './region-registry';

describe('V16 region registry',()=>{
  it('defines six canonical outing regions in stable order',()=>{
    expect(REGION_IDS).toEqual([
      'forest',
      'village',
      'lakeside',
      'old_shrine',
      'herb_hills',
      'expedition_outpost',
    ]);
    expect(LEGACY_REGION_IDS).toEqual(['forest','village','lakeside']);
    expect(LIVING_REGION_IDS).toEqual(['old_shrine','herb_hills','expedition_outpost']);
  });

  it('resolves every canonical region through the registry',()=>{
    expect(Object.keys(regionRegistry)).toEqual(REGION_IDS);
    for(const id of REGION_IDS){
      const definition=getRegionDefinition(id);
      expect(definition.id).toBe(id);
      expect(definition.name.trim().length).toBeGreaterThan(0);
      expect(definition.summary.trim().length).toBeGreaterThan(0);
      expect(definition.entranceLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it('gives the three V16 living regions distinct authored identities',()=>{
    const living=LIVING_REGION_IDS.map(id=>getRegionDefinition(id));
    expect(living.map(item=>item.name)).toEqual(['고대 신전','약초 언덕','원정 전초기지']);
    expect(new Set(living.map(item=>item.summary)).size).toBe(3);
    expect(new Set(living.map(item=>item.entranceLabel)).size).toBe(3);
  });
});
