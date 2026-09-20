import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const cave=readFileSync(new URL('./adventure3d/hollow-cave.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 Hollow Cave complete exploration loop',()=>{
  it('turns the hidden cave discovery into a bounded playable interior',()=>{
    expect(cave).toContain('constrainHollowCavePlayer');
    expect(cave).toContain('chamberRadius');
    expect(slice).toContain('hollowCaveInsideEntryPosition');
    expect(slice).toContain('constrainHollowCavePlayer(playerRef.current.position)');
    expect(renderer).toContain('drawHollowCave');
    expect(renderer).toContain("rgba(8,13,20,.84)");
  });

  it('uses the existing wind ability to solve three resonators instead of adding a bespoke puzzle button',()=>{
    expect(cave).toContain('castHollowCaveWindPulse');
    expect(cave).toContain('resonatorMask');
    expect(slice).toContain("ability!=='windPulse'");
    expect(slice).toContain('동굴 안 공명');
    expect(slice).toContain("onClick={()=>castEnvironmentAbility('windPulse')}");
  });

  it('persists only the meaningful shortcut result and keeps the chamber runtime transient',()=>{
    expect(persistence).toContain("type:'open-hollow-shortcut'");
    expect(persistence).toContain('hollowCave:{shortcutOpen:false}');
    expect(slice).toContain("requestOpenAdventureUpdate({type:'open-hollow-shortcut'})");
    expect(persistence).not.toContain('resonatorMask');
    expect(persistence).not.toContain('inside:boolean');
  });

  it('creates a two-way route between the hidden cave and the old bridge area',()=>{
    expect(cave).toContain('hollowCaveReturnFromShortcut');
    expect(cave).toContain('playerNearHollowCaveOutsideShortcut');
    expect(slice).toContain('hollowCaveInsideShortcutSpawn');
    expect(slice).toContain("'돌다리로 나가기'");
    expect(slice).toContain("'동굴 지름길'");
  });
});
