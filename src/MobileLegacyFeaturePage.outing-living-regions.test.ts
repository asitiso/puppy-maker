import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const page=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');
const navigation=readFileSync(new URL('./exploration/outing-navigation.ts',import.meta.url),'utf8');

describe('V16 outing living-region routing contract',()=>{
  it('routes every canonical region through shared navigation without widening legacy OutingLocationId',()=>{
    expect(page).toContain("type OutingSceneId} from './exploration/outing-navigation'");
    expect(navigation).toContain("export type OutingSceneId='crossroads'|RegionId");
    expect(navigation).toContain('isLegacyRegionId(sceneId)');
    expect(navigation).toContain('isLivingRegionId(sceneId)');
    expect(navigation).toContain('isRegionId(value)?value:null');
    expect(page).toContain('<LivingRegionSceneFlow');
    expect(page).toContain('regionId={outingRoute.regionId}');
    expect(page).toContain('progress={state.livingRegions[outingRoute.regionId]}');
  });

  it('keeps legacy outing progression isolated from living-region progress',()=>{
    expect(page).toContain('<OutingSceneFlow');
    expect(page).toContain('onOuting={outingLocation=>{');
    expect(page).toContain('onOuting(outingLocation);');
    expect(page).not.toContain("onOuting('old_shrine')");
    expect(page).not.toContain("onOuting('herb_hills')");
    expect(page).not.toContain("onOuting('expedition_outpost')");
  });

  it('uses registry guards as the single classification source instead of component-local destination guards',()=>{
    expect(page).toContain('getOutingRoute(outingScene)');
    expect(page).toContain('parseOutingDestination(destinationId)');
    expect(page).not.toContain('function isOutingLocation');
    expect(page).not.toContain('function isLivingRegion');
    expect(page).not.toContain('function isPlayableOutingDestination');
  });
});
