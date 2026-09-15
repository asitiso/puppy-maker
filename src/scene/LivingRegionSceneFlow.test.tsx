import {describe,expect,it} from 'vitest';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('./LivingRegionSceneFlow.tsx',import.meta.url),'utf8');

describe('V16 living region scene flow',()=>{
  it('keeps every living region on the shared persistent exploration runtime',()=>{
    expect(source).toContain('regionId:LivingRegionId');
    expect(source).toContain('livingRegionExplorationBuilders[regionId](progress');
    expect(source).toContain('completedInteractionIds={progress.completedInteractions}');
    expect(source).toContain('onInteractionComplete={handleInteractionComplete}');
    expect(source).toContain("onUpdate({kind:'recordInteraction',interactionId})");
    expect(source).toContain("onUpdate({kind:'recordDiscovery',discoveryId})");
    expect(source).toContain("onUpdate({kind:'startMainQuest'})");
    expect(source).toContain("onUpdate({kind:'resolveMainQuest'})");
    expect(source).toContain("onUpdate({kind:'advancePostResolution'})");
  });
});
