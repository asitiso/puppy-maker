import { expect, it } from 'vitest';
import overlayFocus from './useOverlayFocusManagement.ts?raw';
import sanctuaryOverlay from './SanctuaryOverlay.tsx?raw';
import raisingOverlay from './RaisingIdentityOverlay.tsx?raw';
import seasonOverlay from './SeasonLiveOpsOverlay.tsx?raw';
import worldOverlay from './WorldProgressOverlay.tsx?raw';

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
