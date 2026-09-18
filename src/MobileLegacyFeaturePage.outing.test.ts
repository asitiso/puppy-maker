import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const page=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('MobileLegacyFeaturePage outing routing contract',()=>{
  it('delegates destination parsing, scene classification, and titles to canonical outing navigation',()=>{
    expect(page).toContain('getOutingRoute(outingScene)');
    expect(page).toContain('getOutingSceneTitle(outingScene,outingCrossroadsWorld.label)');
    expect(page).toContain('parseOutingDestination(destinationId)');
    expect(page).not.toContain('function isOutingLocation');
    expect(page).not.toContain('function isLivingRegion');
    expect(page).not.toContain('function isPlayableOutingDestination');
  });

  it('returns from any region to its crossroads portal before leaving the outing feature',()=>{
    expect(page).toContain('const returnToCrossroads=(regionId:RegionId)=>{setCrossroadsReturnRegion(regionId);setOutingScene(\'crossroads\');};');
    expect(page).toContain('onBack={atCrossroads?onBack:()=>returnToCrossroads(outingRoute.regionId)}');
    expect(page).toContain('world={outingCrossroadsWorldForReturn(crossroadsReturnRegion)}');
    expect(page).toContain('onExit={()=>returnToCrossroads(outingRoute.regionId)}');
  });

  it('preserves legacy outing progression while living regions use their additive scene flow',()=>{
    expect(page).toContain("outingRoute.kind==='legacy'?<OutingSceneFlow");
    expect(page).toContain('onOuting={outingLocation=>{');
    expect(page).toContain('onOuting(outingLocation);');
    expect(page).toContain('<LivingRegionSceneFlow');
    expect(page).toContain('progress={state.livingRegions[outingRoute.regionId]}');
  });
});
