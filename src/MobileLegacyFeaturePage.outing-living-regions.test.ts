import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const page=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('V16 outing living-region routing contract',()=>{
  it('routes Old Shrine from the crossroads without widening legacy OutingLocationId',()=>{
    expect(page).toContain("type OutingSceneId='crossroads'|OutingLocationId|'old_shrine'");
    expect(page).toContain("value==='old_shrine'");
    expect(page).toContain('<LivingRegionSceneFlow');
    expect(page).toContain('progress={state.livingRegions.old_shrine}');
    expect(page).toContain("regionId='old_shrine'");
  });

  it('keeps legacy outing progression isolated from living-region progress',()=>{
    expect(page).toContain('<OutingSceneFlow');
    expect(page).toContain('onOuting={outingLocation=>{');
    expect(page).not.toContain("onOuting('old_shrine')");
  });

  it('does not expose unfinished living regions as playable placeholder scenes',()=>{
    expect(page).not.toContain("type OutingSceneId='crossroads'|RegionId");
    expect(page).not.toContain("regionId='herb_hills'");
    expect(page).not.toContain("regionId='expedition_outpost'");
  });
});
