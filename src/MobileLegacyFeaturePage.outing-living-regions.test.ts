import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const page=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('V16 outing living-region routing contract',()=>{
  it('routes all completed living regions from the crossroads without widening legacy OutingLocationId',()=>{
    expect(page).toContain("type OutingSceneId='crossroads'|OutingLocationId|'old_shrine'|'herb_hills'|'expedition_outpost'");
    expect(page).toContain("value==='old_shrine'||value==='herb_hills'||value==='expedition_outpost'");
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

  it('keeps living-region routing explicit rather than widening every registry region into a playable scene',()=>{
    expect(page).not.toContain("type OutingSceneId='crossroads'|RegionId");
  });
});
