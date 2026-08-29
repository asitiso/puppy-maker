import { expect, it } from 'vitest';
// @ts-ignore -- Vitest executes this contract test in Node; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import overlayFocus from './useOverlayFocusManagement.ts?raw';
import sanctuaryOverlay from './SanctuaryOverlay.tsx?raw';
import raisingOverlay from './RaisingIdentityOverlay.tsx?raw';
import seasonOverlay from './SeasonLiveOpsOverlay.tsx?raw';
import worldOverlay from './WorldProgressOverlay.tsx?raw';
import guardianOverlay from './GuardianExpeditionOverlay.tsx?raw';
import archiveOverlay from './CollectionArchiveOverlay.tsx?raw';
import storyEvent from './components/StoryEvent.tsx?raw';
import layeredHome from './LayeredHome.tsx?raw';
import tacticalBattle from './TacticalBattleScreen.tsx?raw';
import actionResult from './ActionResultSummary.tsx?raw';
import buildEditor from './V12BuildEditor.tsx?raw';

const css = (path:string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const storyCss = css('./story-dialogue-stage.css');
const expeditionCss = css('./expedition-ui.css');
const polishCss = css('./v14-polish-pass-4.css');
const mainSource = css('./main.tsx');

it('global overlays share complete modal focus lifecycle', () => {
  expect(overlayFocus).toMatch(/event\.key === 'Escape'/);
  expect(overlayFocus).toMatch(/event\.key !== 'Tab'/);
  expect(overlayFocus).toMatch(/initialFocusRef\.current\?\.focus\(\)/);
  expect(overlayFocus).toMatch(/restoreTarget\?\.focus\(\)/);

  for (const overlay of [sanctuaryOverlay, raisingOverlay, seasonOverlay, worldOverlay, guardianOverlay, archiveOverlay]) {
    expect(overlay).toMatch(/useOverlayFocusManagement/);
    expect(overlay).toMatch(/dialogRef/);
    expect(overlay).toMatch(/initialFocusRef/);
    expect(overlay).toContain('role="dialog"');
    expect(overlay).toContain('aria-modal="true"');
  }
});

it('gives expedition and story archive labelled local-back dialog navigation', () => {
  for (const overlay of [guardianOverlay, archiveOverlay]) {
    expect(overlay).toContain('aria-labelledby={titleId}');
    expect(overlay).toContain('<V14OverlayBackButton');
    expect(overlay).toContain('launcherRef');
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
  expect(polishCss).toContain('.expedition-map,.expedition-battle,.expedition-result{overscroll-behavior:contain');
});

it('keeps the archive bounded and touch-safe at phone heights', () => {
  expect(mainSource).toContain("import './v14-polish-pass-4.css';");
  expect(polishCss).toContain('100dvh');
  expect(polishCss).toContain('overscroll-behavior:contain');
  expect(polishCss).toContain('min-height:44px');
  expect(polishCss).toContain('@media(max-height:650px)');
  expect(polishCss).toContain('@media(prefers-reduced-motion:reduce)');
});

it('keeps home panels focus-contained and outing handoff idempotent', () => {
  expect(layeredHome).toContain("import { useOverlayFocusManagement } from './useOverlayFocusManagement'");
  expect(layeredHome).toContain('useOverlayFocusManagement({');
  expect(layeredHome).toContain('dialogRef: panelRef');
  expect(layeredHome).toContain('launcherRef: panelLauncherRef');
  expect(layeredHome).toContain('initialFocusRef: panelCloseRef');
  expect(layeredHome).toMatch(/const outingTransitionRef = useRef\(false\)/);
  expect(layeredHome).toMatch(/if \(outingTransitionRef\.current\) return;/);
  expect(layeredHome).toMatch(/outingTransitionRef\.current = true;/);
});

it('gives the tactical result modal the same focus lifecycle as other overlays', () => {
  expect(tacticalBattle).toContain("import {useOverlayFocusManagement} from './useOverlayFocusManagement';");
  expect(tacticalBattle).toContain('resultDialogRef');
  expect(tacticalBattle).toContain('resultPrimaryRef');
  expect(tacticalBattle).toContain('useOverlayFocusManagement({');
  expect(actionResult).toContain('buttonRef?:');
  expect(actionResult).toContain('ref={buttonRef}');
});

it('anchors build choices with an explicit current-build summary', () => {
  expect(buildEditor).toContain('v12-build-editor__current');
  expect(buildEditor).toContain('현재 편성');
  expect(buildEditor).toContain('현재 Leader');
  expect(buildEditor).toContain('현재 의상');
  expect(buildEditor).toContain('현재 장비');
});
