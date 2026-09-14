import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('V14 player-facing outing wiring',()=>{
  it('enters the crossroads first and opens OutingSceneFlow only through an in-world portal',()=>{
    expect(source).toContain("import OutingSceneFlow from './scene/OutingSceneFlow'");
    expect(source).toContain("import {outingCrossroadsWorld} from './exploration/outing-crossroads'");
    expect(source).toContain("const [outingScene,setOutingScene]=useState<OutingSceneId>('crossroads')");
    expect(source).toContain('world={outingCrossroadsWorld}');
    expect(source).toContain('onPortal={destinationId=>');
    expect(source).toContain('setOutingScene(destinationId)');
    expect(source).toContain('<OutingSceneFlow');
    expect(source).toContain('onOuting(outingLocation)');
    expect(source).toContain("onExit={()=>setOutingScene('crossroads')}");
  });

  it('passes deterministic current and inherited world facts into the resolved outing scene',()=>{
    expect(source).toContain('worldFacts={state.worldHistory.currentFacts}');
    expect(source).toContain('inheritedWorldFacts={state.worldHistory.inheritedFacts}');
  });
});