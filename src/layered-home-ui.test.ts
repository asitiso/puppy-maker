import { describe, expect, it } from 'vitest';
import home from './LayeredHome.tsx?raw';
import homeCss from './layered-home.css?raw';
import panelCss from './home-panels.css?raw';
import seasonCss from './season-live-ops.css?raw';
import seasonalHomeCss from './seasonal-home.css?raw';
import worldCss from './world-progress.css?raw';
import raisingCss from './raising-identity.css?raw';
import expeditionCss from './expedition-ui.css?raw';
import tacticalCss from './tactical-battle.css?raw';
import seasonOverlay from './SeasonLiveOpsOverlay.tsx?raw';
import worldOverlay from './WorldProgressOverlay.tsx?raw';
import raisingOverlay from './RaisingIdentityOverlay.tsx?raw';
import expeditionOverlay from './GuardianExpeditionOverlay.tsx?raw';

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

  it('marks only an opened bottom destination as current', () => {
    expect(home).toContain('useState(-1)');
    expect(home).toContain("aria-current={activeNav === index ? 'page' : undefined}");
    expect(home).toContain('setActiveNav(-1);');
  });

  it('keeps panel navigation visible while long content scrolls independently', () => {
    expect(home).toContain('className="lh-panel-header"');
    expect(panelCss).toMatch(/\.lh-panel-list\{[^}]*overflow-y:auto/);
  });

  it('restores focus to the launcher after closing each major hub overlay', () => {
    for (const overlay of [raisingOverlay, worldOverlay, seasonOverlay, expeditionOverlay]) {
      expect(overlay).toContain('launcherRef');
      expect(overlay).toContain('launcherRef.current?.focus()');
    }
  });

  it('keeps major overlay chrome inside safe areas with usable close targets', () => {
    for (const css of [raisingCss, worldCss, seasonCss, expeditionCss]) {
      expect(css).toContain('safe-area-inset-top');
      expect(css).toContain('safe-area-inset-bottom');
      expect(css).toContain('min-height:44px');
    }
  });

  it('reduces competing status and promo surfaces on the smallest 9:16 home', () => {
    expect(seasonalHomeCss).toMatch(/@media\(max-width:390px\)\{\.seasonal-home-badge\{[^}]*display:none/);
    expect(homeCss).toMatch(/@media\(max-width:390px\)\{\.lh-promos\{display:none/);
    expect(seasonCss).toContain('.season-live-entry{right:3%;top:34%;width:31%;height:10.5%');
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
