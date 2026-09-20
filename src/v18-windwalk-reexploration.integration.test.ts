import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const routes=readFileSync(new URL('./adventure3d/windwalk-routes.ts',import.meta.url),'utf8');
const windwalk=readFileSync(new URL('./adventure3d/windwalk.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 Windwalk re-exploration integration',()=>{
  it('reveals a new aerial route in the existing Dawnreach field only after Windwalk unlock',()=>{
    expect(routes).toContain('WINDWALK_ROUTE');
    expect(routes).toContain('currents:[');
    expect(routes).toContain('traces:[');
    expect(slice).toContain('windwalkRouteVisual(');
    expect(renderer).toContain('drawWindwalkRoute');
  });

  it('uses held glide through updrafts and collects traces by physical airborne proximity',()=>{
    expect(slice).toContain('applyWindwalkCurrent(');
    expect(slice).toContain('findWindwalkTrace(');
    expect(routes).toContain('if(!unlocked||!held||state.grounded');
    expect(routes).toContain('distance3(player.position,trace.position)');
    expect(slice).toContain("requestOpenAdventureUpdate({type:'discover-windwalk-trace',id:trace})");
  });

  it('persists only found trace ids and derives mastery from all three',()=>{
    expect(persistence).toContain("type:'discover-windwalk-trace'");
    expect(persistence).toContain('windwalkTraces:WindwalkTraceId[]');
    expect(slice).toContain('windwalkMasteredRef');
    expect(windwalk).toContain('masteredStaminaPerSecond:13');
    expect(persistence).not.toContain('boostedCurrentId');
  });

  it('uses a world overlay extension point instead of adding another renderer positional entity',()=>{
    expect(renderer).toContain('export type AdventureWorldOverlay');
    expect(renderer).toContain('worldOverlay:AdventureWorldOverlay={}');
    expect(slice).toContain('windwalkRoute:windwalkRouteVisual(');
  });
});
