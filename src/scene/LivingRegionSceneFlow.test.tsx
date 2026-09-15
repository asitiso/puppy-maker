import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const flow=readFileSync(new URL('./LivingRegionSceneFlow.tsx',import.meta.url),'utf8');

describe('V16 living region scene flow contract',()=>{
  it('restores persisted interaction completion into the shared exploration runtime',()=>{
    expect(flow).toContain('completedInteractionIds={progress.completedInteractions}');
    expect(flow).toContain('onInteractionComplete={handleInteractionComplete}');
  });

  it('maps Old Shrine authored interactions to persistent quest and discovery updates',()=>{
    expect(flow).toContain("kind:'recordInteraction'");
    expect(flow).toContain("kind:'recordDiscovery'");
    expect(flow).toContain("kind:'startMainQuest'");
    expect(flow).toContain("kind:'resolveMainQuest'");
    expect(flow).toContain("kind:'advancePostResolution'");
  });

  it('enters an unvisited living region without using the legacy outing progression callback',()=>{
    expect(flow).toContain("progress.phase==='unvisited'");
    expect(flow).toContain("kind:'enter'");
    expect(flow).toContain('onProgress={noop}');
  });
});
