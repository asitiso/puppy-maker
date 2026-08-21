import { describe, expect, it } from 'vitest';
// @ts-ignore -- Vitest executes this contract test in Node; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import home from './LayeredHome.tsx?raw';
import seasonOverlay from './SeasonLiveOpsOverlay.tsx?raw';
import worldOverlay from './WorldProgressOverlay.tsx?raw';
import raisingOverlay from './RaisingIdentityOverlay.tsx?raw';
import expeditionOverlay from './GuardianExpeditionOverlay.tsx?raw';

const css = (path:string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const globalCss = css('./styles.css');
const homeCss = css('./layered-home.css');
const mobileCss = css('./layered-home-mobile.css');
const flowCss = css('./hub-flow-mobile.css');
const panelCss = css('./home-panels.css');
const seasonCss = css('./season-live-ops.css');
const seasonalHomeCss = css('./seasonal-home.css');
const worldCss = css('./world-progress.css');
const raisingCss = css('./raising-identity.css');
const expeditionCss = css('./expedition-ui.css');
const tacticalCss = css('./tactical-battle.css');

describe('Layered Home mobile UI contract', () => {
  it('exposes one prominent current-task action on the home scene', () => {
    expect(home).toContain('className="lh-primary-action"');
    expect(home).toContain('지금 할 일');
    expect(home).toContain('conditionLabels[state.condition]');
    expect(home).toContain('${stamina}/100');
  });

  it('suppresses unsupported weather copy instead of presenting it as game state', () => {
    expect(home).toContain('☀ 맑음');
    expect(homeCss).toContain('.lh-weather span{display:none}');
  });

  it('uses a dynamic viewport override without removing the existing vh fallback', () => {
    expect(globalCss).toContain('.page{min-height:100vh');
    expect(globalCss).toContain('.game-shell{position:relative;width:min(100vw,56.25vh);height:min(100vh,177.78vw)');
    expect(homeCss).toContain('@supports(height:100dvh){.page{min-height:100dvh}.game-shell{width:min(100vw,56.25dvh);height:min(100dvh,177.78vw)}}');
  });

  it('keeps long goal copy clipped inside the card at 430px-class widths', () => {
    expect(homeCss).toContain('.lh-goal p{font-size:clamp(8px,1.98vw,12px);margin:4.5% 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}');
  });

  it('keeps four compact shortcuts at usable touch size without overflowing their lane', () => {
    expect(mobileCss).toContain('@media(max-width:390px)');
    expect(mobileCss).toContain('width:54%');
    expect(mobileCss).toContain('flex:1 1 44px');
    expect(mobileCss).toContain('min-width:44px');
  });

  it('keeps the shortcut lane viable at the 320px minimum shell width', () => {
    expect(mobileCss).toContain('@media(max-width:340px)');
    expect(mobileCss).toContain('.layered-home .lh-shortcuts{width:58%;gap:.5%}');
    expect(mobileCss).toContain('.layered-home .lh-goal{width:31%}');
  });

  it('keeps the primary CTA readable at 360x640 without three stacked text rows', () => {
    expect(mobileCss).toContain('@media(max-width:390px) and (max-height:650px)');
    expect(mobileCss).toContain('.layered-home .lh-primary-action span{display:none}');
    expect(mobileCss).toContain('.layered-home .lh-primary-action{min-height:48px;padding:5px 10px}');
  });

  it('keeps tap controls and panel scrolling on deliberate touch gestures', () => {
    expect(homeCss).toContain('touch-action:manipulation');
    expect(panelCss).toMatch(/\.lh-panel-list\{[^}]*touch-action:pan-y/);
  });

  it('keeps top and action chrome clear of device safe areas', () => {
    expect(mobileCss).toContain('safe-area-inset-top');
    expect(mobileCss).toContain('safe-area-inset-bottom');
    expect(mobileCss).toContain('bottom:calc(31.5% + env(safe-area-inset-bottom)*.12)');
  });

  it('reduces tertiary collection detail on short 9:16 screens', () => {
    expect(mobileCss).toContain('.lh-goal p:nth-of-type(3){display:none}');
  });

  it('marks only an opened bottom destination as current', () => {
    expect(home).toContain('useState(-1)');
    expect(home).toContain("aria-current={activeNav === index ? 'page' : undefined}");
    expect(home).toContain('setActiveNav(-1);');
  });

  it('supports a keyboard round trip for home panels', () => {
    expect(home).toContain('panelLauncherRef');
    expect(home).toContain('panelCloseRef');
    expect(home).toContain("event.key !== 'Escape'");
    expect(home).toContain('panelCloseRef.current?.focus()');
    expect(home).toContain('panelLauncherRef.current?.focus()');
    expect(home).toContain('ref={panelCloseRef}');
  });

  it('keeps panel navigation visible while long content scrolls independently', () => {
    expect(home).toContain('className="lh-panel-header"');
    expect(panelCss).toMatch(/\.lh-panel-list\{[^}]*overflow-y:auto/);
    expect(panelCss).toContain('-webkit-overflow-scrolling:touch');
  });

  it('prevents horizontal panel drift while preserving vertical touch scroll', () => {
    expect(panelCss).toMatch(/\.lh-panel-backdrop\{[^}]*overflow:hidden/);
    expect(panelCss).toMatch(/\.lh-panel-list\{[^}]*overflow-x:hidden/);
    expect(panelCss).toMatch(/\.lh-panel-list\{[^}]*touch-action:pan-y/);
    expect(panelCss).toMatch(/\.lh-panel-list button\{[^}]*min-width:0/);
  });

  it('bounds compact panels to the visual viewport and clamps secondary copy', () => {
    expect(panelCss).toContain('calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 16px)');
    expect(panelCss).toContain('-webkit-line-clamp:2');
    expect(panelCss).toContain('text-overflow:ellipsis');
  });

  it('restores focus to the launcher after closing each major hub overlay', () => {
    for (const overlay of [raisingOverlay, worldOverlay, seasonOverlay, expeditionOverlay]) {
      expect(overlay).toContain('launcherRef');
      expect(overlay).toContain('launcherRef.current?.focus()');
    }
  });

  it('lets keyboard users back out of each major overlay with Escape', () => {
    for (const overlay of [raisingOverlay, worldOverlay, seasonOverlay, expeditionOverlay]) {
      expect(overlay).toContain("event.key !== 'Escape'");
      expect(overlay).toContain("window.addEventListener('keydown'");
      expect(overlay).toContain("window.removeEventListener('keydown'");
    }
  });

  it('keeps major overlay chrome inside safe areas with usable close targets', () => {
    for (const rawCss of [raisingCss, worldCss, seasonCss, expeditionCss]) {
      expect(rawCss).toContain('safe-area-inset-top');
      expect(rawCss).toContain('safe-area-inset-bottom');
      expect(rawCss).toContain('min-height:44px');
    }
  });

  it('keeps home-return chrome reachable while long major overlays scroll', () => {
    expect(homeCss).toContain("@import './hub-flow-mobile.css'");
    expect(flowCss).toContain("@import './layered-home-mobile.css'");
    expect(flowCss).toContain('.raising-content header{position:sticky');
    expect(flowCss).toContain('.world-progress-close{position:sticky');
    expect(flowCss).toContain('.expedition-map header,.expedition-battle header{position:sticky');
    expect(seasonCss).toContain('.season-live-content header{position:sticky');
  });

  it('reduces competing status and promo surfaces on the smallest 9:16 home', () => {
    expect(seasonalHomeCss).toMatch(/@media\(max-width:390px\)\{\.seasonal-home-badge\{[^}]*display:none/);
    expect(homeCss).toMatch(/@media\(max-width:390px\)\{\.lh-promos\{display:none/);
    expect(seasonCss).toContain('.season-live-entry{right:3%;top:34%;width:31%;height:10.5%');
    expect(flowCss).toContain('@media(max-width:390px){.world-progress-card{top:49.5%}}');
  });

  it('keeps tactical UI within the mobile viewport without changing engine rules', () => {
    expect(tacticalCss).toContain('height:100dvh');
    expect(tacticalCss).toContain('safe-area-inset-top');
    expect(tacticalCss).toContain('safe-area-inset-bottom');
    expect(tacticalCss).toContain('min-height:44px');
  });

  it('provides clear focus feedback for touch controls used with a keyboard', () => {
    expect(homeCss).toContain(':focus-visible');
    expect(raisingCss).toContain(':focus-visible');
    expect(worldCss).toContain(':focus-visible');
    expect(seasonCss).toContain(':focus-visible');
    expect(expeditionCss).toContain(':focus-visible');
  });
});