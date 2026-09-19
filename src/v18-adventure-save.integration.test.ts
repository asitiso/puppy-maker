// @ts-ignore -- source-contract test uses Node fs outside app tsconfig.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {initialState,reducer} from './game';
import {hydrateSave,serializeGameState} from './game/save';
import {emptyAdventureWorldState} from './adventure3d/adventure-world-state';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');

describe('V18 adventure world save integration',()=>{
  it('round trips V18 world state through the canonical GameState save envelope',()=>{
    const adventureWorld=emptyAdventureWorldState();
    adventureWorld.dawnreach.visitedDiscoveries=['echo-ruins'];
    adventureWorld.dawnreach.ruin={...adventureWorld.dawnreach.ruin,solved:true,rewardClaimed:true};
    adventureWorld.dawnreach.echoSenseUnlocked=true;
    adventureWorld.dawnreach.defeatedEnemyIds=['ash-runner-a'];
    const next=reducer(initialState,{type:'SET_ADVENTURE_WORLD',adventureWorld});
    const hydrated=hydrateSave(serializeGameState(next));
    expect(hydrated.adventureWorld.dawnreach.visitedDiscoveries).toEqual(['echo-ruins']);
    expect(hydrated.adventureWorld.dawnreach.echoSenseUnlocked).toBe(true);
    expect(hydrated.adventureWorld.dawnreach.defeatedEnemyIds).toEqual(['ash-runner-a']);
  });

  it('routes runtime snapshots through App reducer rather than a second localStorage save',()=>{
    expect(slice).toContain('requestAdventureWorldUpdate(snapshotDawnreachRuntime');
    expect(app).toContain('adventureWorldUpdateRequestEvent');
    expect(app).toContain("dispatch({type:'SET_ADVENTURE_WORLD',adventureWorld})");
    expect(slice).not.toContain('localStorage');
  });

  it('restores saved world state when the field mounts and persists before exit',()=>{
    expect(slice).toContain('restoreDawnreachRuntime(state.adventureWorld.dawnreach)');
    expect(slice).toContain('const exitField=useCallback');
    expect(slice).toContain('persistWorld();');
    expect(slice).toContain('onClick={exitField}');
  });
});
