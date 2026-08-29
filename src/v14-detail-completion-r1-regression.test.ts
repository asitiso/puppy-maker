import { expect, it } from 'vitest';
import buildEditor from './V12BuildEditor.tsx?raw';
import overlayFocus from './useOverlayFocusManagement.ts?raw';
import sanctuary from './SanctuaryOverlay.tsx?raw';
import raising from './RaisingIdentityOverlay.tsx?raw';
import season from './SeasonLiveOpsOverlay.tsx?raw';
import world from './WorldProgressOverlay.tsx?raw';

it('uses one V14-local back control and labelled dialog titles across major overlays', () => {
  for (const overlay of [sanctuary, raising, season, world]) {
    expect(overlay).toContain("from './V14OverlayBackButton'");
    expect(overlay).toContain('aria-labelledby={titleId}');
    expect(overlay).toContain('id={titleId}');
  }

  expect(sanctuary).toContain('label="이전 화면"');
  expect(raising).toContain('label="이전 화면"');
  expect(season).toContain('label="이전 화면"');
  expect(world).toContain('label="이전 화면"');
});

it('brings Build Editor into the existing V14 overlay focus lifecycle', () => {
  expect(overlayFocus).toMatch(/launcherRef\?:/);
  expect(buildEditor).toContain('useOverlayFocusManagement');
  expect(buildEditor).toContain('dialogRef');
  expect(buildEditor).toContain('initialFocusRef');
  expect(buildEditor).toContain('open: true');
  expect(buildEditor).toContain("from './V14OverlayBackButton'");
});

it('explains existing loadout consequences before a Build Editor choice is applied', () => {
  expect(buildEditor).toContain('equipmentCompatibilityWarning');
  expect(buildEditor).toContain('해제 예정');
  expect(buildEditor).toContain('equipmentEffectDetail');
  expect(buildEditor).toContain('effect.chainTargets');
  expect(buildEditor).toContain('effect.interceptRatio');
  expect(buildEditor).toContain('effect.bonusRatio');
  expect(buildEditor).toContain('연쇄 대상');
  expect(buildEditor).toContain('대신 받고 반격');
  expect(buildEditor).toContain('협동 공격 +');
});
