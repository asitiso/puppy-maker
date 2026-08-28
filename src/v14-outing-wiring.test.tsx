import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('./MobileLegacyFeaturePage.tsx',import.meta.url),'utf8');

describe('V14 player-facing outing wiring',()=>{
  it('opens OutingSceneFlow before the canonical outing callback',()=>{
    expect(source).toContain("import OutingSceneFlow from './scene/OutingSceneFlow'");
    expect(source).toContain('const [outingScene,setOutingScene]');
    expect(source).toContain('<OutingSceneFlow');
    expect(source).toContain('setOutingScene(id)');
    expect(source).toContain('onOuting(location)');
  });

  it('passes deterministic current and inherited world facts into the resolved outing scene',()=>{
    expect(source).toContain('worldFacts={state.worldHistory.currentFacts}');
    expect(source).toContain('inheritedWorldFacts={state.worldHistory.inheritedFacts}');
  });
});
