import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const opening=readFileSync(new URL('./adventure3d/opening-experience.ts',import.meta.url),'utf8');
const slice=readFileSync(new URL('./adventure3d/AdventureVerticalSlice.tsx',import.meta.url),'utf8');
const renderer=readFileSync(new URL('./adventure3d/software-renderer.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('./adventure3d/adventure-vertical-slice.css',import.meta.url),'utf8');
const persistence=readFileSync(new URL('./adventure3d/open-adventure-state.ts',import.meta.url),'utf8');

describe('V18 first-ten-minutes exploration UX',()=>{
  it('shows a wide but interruptible opening instead of locking the player into a cutscene',()=>{
    expect(opening).toContain('dawnreachOpeningCamera');
    expect(opening).toContain('state.moved');
    expect(opening).toContain('state.looked');
    expect(slice).toContain('markDawnreachOpeningLooked');
    expect(slice).not.toContain('openingControlsLocked');
  });

  it('teaches environmental reading without a single quest-arrow destination',()=>{
    expect(opening).toContain('전망대');
    expect(opening).toContain('폐허');
    expect(opening).toContain('연기');
    expect(opening).toContain('퀘스트 화살표 대신');
    expect(opening).not.toContain('questMarker');
  });

  it('turns every discovered place into a short world-space reveal and title moment',()=>{
    expect(slice).toContain('createDiscoveryReveal(target)');
    expect(renderer).toContain('drawDiscoveryReveal');
    expect(renderer).toContain('discoveryReveal?:DiscoveryReveal|null');
    expect(slice).toContain('DISCOVERED');
    expect(css).toContain('.adventure3d__discovery-reveal');
  });

  it('quietens the initial HUD without removing controls or adding persistence flags',()=>{
    expect(slice).toContain('data-opening={openingTitleVisible||undefined}');
    expect(css).toContain('.adventure3d[data-opening="true"] .adventure3d__hud');
    expect(slice).toContain('<MobileJoystick');
    expect(slice).toContain('className="adventure3d__actions"');
    expect(persistence).not.toContain('openingTitleVisible');
    expect(persistence).not.toContain('tutorialComplete');
    expect(persistence).not.toContain('discoveryReveal');
  });
});
