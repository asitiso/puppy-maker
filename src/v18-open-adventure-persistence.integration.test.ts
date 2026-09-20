// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
const reducer=readFileSync(new URL('./app-living-region-reducer.ts',import.meta.url),'utf8');
const persistent=readFileSync(new URL('./v3-persistent-state.ts',import.meta.url),'utf8');

describe('V18 open adventure persistence integration',()=>{
  it('restores major Dawnreach accomplishments from canonical game state',()=>{
    expect(slice).toContain('hydrateOpenAdventureState(state.openAdventure).dawnreach');
    expect(slice).toContain('createDawnreachFieldEnemies(');
    expect(slice).toContain('persisted.campCleared');
    expect(slice).toContain('persisted.skybreak.beaconReached');
    expect(slice).toContain('new Set<string>(persisted.discoveredIds)');
    expect(slice).toContain('persisted.ruin.stonePosition');
    expect(slice).toContain('persisted.echoSenseUnlocked');
  });

  it('writes meaningful discoveries puzzle progress and camp resolution through the event bridge',()=>{
    expect(slice).toContain("requestOpenAdventureUpdate({type:'discover'");
    expect(slice).toContain("type:'sync-ruin'");
    expect(slice).toContain("requestOpenAdventureUpdate({type:'clear-camp'})");
    expect(app).toContain('openAdventureUpdateRequestEvent');
    expect(app).toContain("dispatch({type:'UPDATE_OPEN_ADVENTURE',update})");
    expect(reducer).toContain("action.type==='UPDATE_OPEN_ADVENTURE'");
  });

  it('persists the slice in normal saves while resetting it at a new-run boundary',()=>{
    expect(persistent).toContain('openAdventure:hydrateOpenAdventureState(source.openAdventure)');
    expect(persistent).toContain('openAdventure:hydrateOpenAdventureState(state.openAdventure)');
    expect(persistent).toContain('openAdventure:emptyOpenAdventureState()');
  });

  it('does not persist transient combat fire or lock-on state as campaign progress',()=>{
    expect(persistent).not.toContain('lockedTarget');
    expect(persistent).not.toContain('burningHazards');
    expect(persistent).not.toContain('playerHp');
    expect(persistent).not.toContain('enemyPosition');
  });
});
