import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {hydrateOpenAdventureState} from './adventure3d/open-adventure-state';

const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('./adventure3d/adventure-vertical-slice.css',import.meta.url),'utf8');

describe('production Adventure blank-screen hardening',()=>{
  it('rehydrates the route boundary so older nested progress shapes cannot crash first render',()=>{
    const hydrated=hydrateOpenAdventureState({
      dawnreach:{
        discoveredIds:[],
        skybreak:{beaconReached:false},
        cloudGarden:{restored:false},
      },
    });
    expect(hydrated.dawnreach.tempestWarden).toEqual({defeated:false});
    expect(hydrated.dawnreach.skybreak.windwalkTraces).toEqual([]);
    expect(slice).toContain('hydrateOpenAdventureState(state.openAdventure).dawnreach');
    expect(slice).not.toContain('const persisted=state.openAdventure.dawnreach;');
  });

  it('catches animation-frame failures that React error boundaries cannot catch',()=>{
    expect(slice).toContain('const safeTick=(time:number)=>');
    expect(slice).toContain("reportClientTelemetry('render_error','adventure_loop')");
    expect(slice).toContain('setRuntimeFault(true)');
    expect(slice).toContain('requestAnimationFrame(safeTick)');
  });

  it('renders a visible recovery surface instead of leaving an empty canvas',()=>{
    expect(slice).toContain('adventure3d__runtime-fallback');
    expect(slice).toContain('홈으로 돌아가기');
    expect(css).toContain('.adventure3d__runtime-fallback');
  });
});
