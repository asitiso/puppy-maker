// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 living world event integration',()=>{
  it('witnesses the roadside event from world proximity rather than a fixed quest marker',()=>{
    expect(slice).toContain('shouldWitnessRoadsideAmbush');
    expect(slice).toContain("roadsideAmbushPhaseRef.current==='hidden'");
    expect(slice).toContain("setWorldEventPhase('witnessed')");
    expect(renderer).toContain('drawWorldEvent');
  });

  it('lets the player intervene or pass and persists either consequence once',()=>{
    expect(slice).toContain("requestOpenAdventureUpdate({type:'resolve-world-event',id:ROADSIDE_AMBUSH.id,outcome:'passed'})");
    expect(slice).toContain("requestOpenAdventureUpdate({type:'resolve-world-event',id:ROADSIDE_AMBUSH.id,outcome:'rescued'})");
    expect(slice).toContain('createRoadsideAmbushEnemies()');
    expect(persistence).toContain("update.type==='resolve-world-event'");
  });

  it('keeps event enemies separate from permanent camp completion',()=>{
    expect(slice).toContain('isStartingCampEnemy');
    expect(slice).toContain('roadsideAmbushDefeated');
    expect(slice).toContain('campLiving');
  });

  it('offers the choice directly in the play surface on desktop and mobile',()=>{
    expect(slice).toContain('adventure3d__world-event');
    expect(slice).toContain('개입');
    expect(slice).toContain('지나가기');
  });
});
