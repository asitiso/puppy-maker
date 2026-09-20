import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const highland=readFileSync(new URL('./adventure3d/skybreak-highland.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 Skybreak Highland complete exploration network',()=>{
  it('gates the new highland behind the old-bridge / Hollow Cave route',()=>{
    expect(highland).toContain('playerNearSkybreakBridge');
    expect(slice).toContain("visitedRef.current.has('old-bridge')");
    expect(slice).toContain('hollowCaveRef.current.shortcutOpen');
    expect(slice).toContain("'고지대 건너기'");
  });

  it('offers a direct wind challenge and a guarded side route instead of one forced corridor',()=>{
    expect(highland).toContain('gustBandZ');
    expect(highland).toContain('applySkybreakGust');
    expect(highland).toContain('createSkybreakEnemies');
    expect(slice).toContain('castSkybreakWindPulse');
    expect(slice).toContain('skybreakHighlandHeight');
    expect(renderer).toContain('drawSkybreakHighland');
  });

  it('keeps field combat state while swapping in local highland enemies',()=>{
    expect(slice).toContain('fieldEnemiesSnapshotRef');
    expect(slice).toContain('createSkybreakEnemies');
    expect(slice).toContain('fieldEnemiesSnapshotRef.current??');
    expect(slice).toContain('const enemyTerrain=cloudGardenRef.current.inside');
    expect(slice).toContain('?skybreakHighlandHeight');
  });

  it('persists only the beacon result and turns it into a two-way Skywatch wind lift',()=>{
    expect(persistence).toContain("type:'reach-skybreak-beacon'");
    expect(persistence).toContain('skybreak:{beaconReached:false,windwalkTraces:[]}');
    expect(slice).toContain("requestOpenAdventureUpdate({type:'reach-skybreak-beacon'})");
    expect(slice).toContain('playerNearSkybreakOutsideLift');
    expect(slice).toContain('skybreakReturnToSkywatch');
    expect(slice).not.toContain('gustClock:number;');
  });
});
