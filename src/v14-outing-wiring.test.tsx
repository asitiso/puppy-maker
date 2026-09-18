import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('V14 player-facing outing wiring',()=>{
  it('enters the crossroads first and opens OutingSceneFlow only through a validated in-world portal',()=>{
    expect(source).toContain("import OutingSceneFlow from './scene/OutingSceneFlow'");
    expect(source).toContain("import {outingCrossroadsWorld,outingCrossroadsWorldForReturn} from './exploration/outing-crossroads'");
    expect(source).toContain("const [outingScene,setOutingScene]=useState<OutingSceneId>('crossroads')");
    expect(source).toContain('world={outingCrossroadsWorldForReturn(crossroadsReturnRegion)}');
    expect(source).toContain('onPortal={destinationId=>');
    expect(source).toContain('const destination=parseOutingDestination(destinationId)');
    expect(source).toContain('if(destination)setOutingScene(destination)');
    expect(source).toContain('<OutingSceneFlow');
    expect(source).toContain('onOuting(outingLocation)');
    expect(source).toContain('onExit={()=>returnToCrossroads(outingRoute.regionId)}');
  });

  it('passes deterministic current and inherited world facts into the resolved outing scene',()=>{
    expect(source).toContain('worldFacts={state.worldHistory.currentFacts}');
    expect(source).toContain('inheritedWorldFacts={state.worldHistory.inheritedFacts}');
  });
});