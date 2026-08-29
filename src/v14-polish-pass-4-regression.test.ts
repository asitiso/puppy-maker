import { expect, it } from 'vitest';
// @ts-ignore -- Vitest executes this contract test in Node; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import overlayFocus from './useOverlayFocusManagement.ts?raw';
import sanctuaryOverlay from './SanctuaryOverlay.tsx?raw';
import raisingOverlay from './RaisingIdentityOverlay.tsx?raw';
import seasonOverlay from './SeasonLiveOpsOverlay.tsx?raw';
import worldOverlay from './WorldProgressOverlay.tsx?raw';
import storyEvent from './components/StoryEvent.tsx?raw';

const css = (path:string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const storyCss = css('./story-dialogue-stage.css');
const expeditionCss = css('./expedition-ui.css');

it('global overlays share complete modal focus lifecycle', () => {
  expect(overlayFocus).toMatch(/event\.key === 'Escape'/);
  expect(overlayFocus).toMatch(/event\.key !== 'Tab'/);
  expect(overlayFocus).toMatch(/initialFocusRef\.current\?\.focus\(\)/);
  expect(overlayFocus).toMatch(/restoreTarget\?\.focus\(\)/);

  for (const overlay of [sanctuaryOverlay, raisingOverlay, seasonOverlay, worldOverlay]) {
    expect(overlay).toMatch(/useOverlayFocusManagement/);
    expect(overlay).toMatch(/dialogRef/);
    expect(overlay).toMatch(/initialFocusRef/);
  }
});

it('keeps story decisions and expedition battle actions reachable on short mobile screens', () => {
  expect(storyEvent).toContain('className="story-dialogue-body"');
  expect(storyCss).toMatch(/\.story-dialogue-panel\{[^}]*grid-template-rows:minmax\(0,1fr\) auto[^}]*overflow:hidden/);
  expect(storyCss).toMatch(/\.story-dialogue-body\{[^}]*min-height:0[^}]*overflow-y:auto[^}]*overscroll-behavior:contain/);
  expect(storyCss).toMatch(/\.story-event-choices button\{[^}]*overflow-wrap:anywhere/);

  expect(expeditionCss).toContain('@media(max-height:650px)');
  expect(expeditionCss).toMatch(/@media\(max-height:650px\)\{[^}]*\.expedition-battle\{overflow:hidden\}/);
  expect(expeditionCss).toMatch(/@media\(max-height:650px\)[\s\S]*?\.expedition-battle-stage\{min-height:0/);
});
