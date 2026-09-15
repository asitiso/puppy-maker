import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const page=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');
const navigation=readFileSync(new URL('./exploration/outing-navigation.ts',import.meta.url),'utf8');

describe('V16 outing living-region routing contract',()=>{
  it('routes every registered living region without widening legacy OutingLocationId',()=>{
    expect(page).toContain("type OutingSceneId} from './exploration/outing-navigation'");
    expect(navigation).toContain("export type OutingSceneId='crossroads'|OutingLocationId|LivingRegionId");
    expect(navigation).toContain('LIVING_REGION_IDS.includes(value as LivingRegionId)');
    expect(navigation).toContain('isOutingLocation(value)||isLivingRegion(value)');
    expect(page).toContain('<LivingRegionSceneFlow');
    expect(page).toContain('regionId={outingRoute.regionId}');
    expect(page).toContain('progress={state.livingRegions[outingRoute.regionId]}');
  });

  it('keeps legacy outing progression isolated from living-region progress',()=>{
    expect(page).toContain('<OutingSceneFlow');
    expect(page).toContain('onOuting={outingLocation=>{');
    expect(page).not.toContain("onOuting('old_shrine')");
    expect(page).not.toContain("onOuting('herb_hills')");
    expect(page).not.toContain("onOuting('expedition_outpost')");
  });

  it('uses only the living-region registry rather than every RegionId as a playable scene',()=>{
    expect(navigation).not.toContain("type OutingSceneId='crossroads'|RegionId");
  });
});
