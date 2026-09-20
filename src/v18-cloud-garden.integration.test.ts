import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const garden=readFileSync(new URL('./adventure3d/cloud-garden.ts',import.meta.url),'utf8');
const routes=readFileSync(new URL('./adventure3d/windwalk-routes.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 Cloud Garden secret-world-change loop',()=>{
  it('unlocks the seam from completed Windwalk mastery instead of a quest flag',()=>{
    expect(garden).toContain('playerNearCloudGardenOutsideEntrance');
    expect(slice).toContain('windwalkMasteredRef.current');
    expect(slice).toContain('cloudGardenEntranceVisual(');
    expect(persistence).not.toContain('cloudGardenUnlocked');
  });

  it('swaps in a self-contained three-guardian combat pocket and restores field combat afterward',()=>{
    expect(garden).toContain('createCloudGardenEnemies');
    expect(garden).toContain("'cloud-sprout-a'");
    expect(garden).toContain("'cloud-root-warden'");
    expect(slice).toContain('fieldEnemiesSnapshotRef.current=enemiesRef.current');
    expect(slice).toContain('createCloudGardenEnemies(cloudGardenRef.current.restored)');
    expect(slice).toContain('leaveCloudGardenToField');
  });

  it('persists only garden restoration after the guardians are cleared',()=>{
    expect(persistence).toContain("type:'restore-cloud-garden'");
    expect(persistence).toContain('cloudGarden:{restored:false}');
    expect(slice).toContain("requestOpenAdventureUpdate({type:'restore-cloud-garden'})");
    expect(persistence).not.toContain('cloud-sprout-a');
    expect(persistence).not.toContain('insideCloudGarden');
  });

  it('turns restoration into a stronger Dawnreach wind network rather than raw loot',()=>{
    expect(routes).toContain('restoredCurrentRadius:8');
    expect(routes).toContain('restoredCurrentHeight:12');
    expect(routes).toContain('restoredLiftSpeed:8');
    expect(slice).toContain('cloudGardenRef.current.restored');
    expect(renderer).toContain('route.restored');
  });

  it('uses the renderer world overlay for both the seam and pocket',()=>{
    expect(renderer).toContain('cloudGarden?:CloudGardenVisual|null');
    expect(renderer).toContain('cloudGardenEntrance?:CloudGardenEntranceVisual|null');
    expect(renderer).toContain('drawCloudGarden');
    expect(renderer).toContain('drawCloudGardenEntrance');
  });
});
