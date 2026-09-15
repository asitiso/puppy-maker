import {describe,expect,it} from 'vitest';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('./LivingRegionSceneFlow.tsx',import.meta.url),'utf8');

describe('V16 living region scene flow',()=>{
  it('keeps Herb Hills on the shared persistent exploration runtime',()=>{
    expect(source).toContain("regionId:Extract<LivingRegionId,'old_shrine'|'herb_hills'>");
    expect(source).toContain("regionId==='herb_hills'?herbHillsExploration(progress,context):oldShrineExploration(progress,context)");
    expect(source).toContain('completedInteractionIds={progress.completedInteractions}');
    expect(source).toContain("onUpdate({kind:'recordDiscovery',discoveryId})");
    expect(source).toContain("onUpdate({kind:'startMainQuest'})");
    expect(source).toContain("onUpdate({kind:'resolveMainQuest'})");
    expect(source).toContain("onUpdate({kind:'advancePostResolution'})");
  });
});
