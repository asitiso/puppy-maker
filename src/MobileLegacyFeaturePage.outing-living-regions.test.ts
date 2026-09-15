import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const page=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('V16 outing living-region routing contract',()=>{
  it('routes every registered living region without widening legacy OutingLocationId',()=>{
    expect(page).toContain("type OutingSceneId='crossroads'|OutingLocationId|LivingRegionId");
    expect(page).toContain('LIVING_REGION_IDS.includes(value as LivingRegionId)');
    expect(page).toContain('isOutingLocation(value)||isLivingRegion(value)');
    expect(page).toContain('<LivingRegionSceneFlow');
    expect(page).toContain('regionId={livingLocation}');
    expect(page).toContain('progress={state.livingRegions[livingLocation]}');
  });

  it('keeps legacy outing progression isolated from living-region progress',()=>{
    expect(page).toContain('<OutingSceneFlow');
    expect(page).toContain('onOuting={outingLocation=>{');
    expect(page).not.toContain("onOuting('old_shrine')");
    expect(page).not.toContain("onOuting('herb_hills')");
    expect(page).not.toContain("onOuting('expedition_outpost')");
  });

  it('uses only the living-region registry rather than every RegionId as a playable scene',()=>{
    expect(page).not.toContain("type OutingSceneId='crossroads'|RegionId");
  });
});
