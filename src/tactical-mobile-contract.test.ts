import { describe, expect, it } from 'vitest';
import battleCss from './tactical-battle.css?raw';
import expeditionCss from './tactical-expedition-flow.css?raw';

describe('tactical mobile interaction contract', () => {
  it('keeps the battle viewport safe, touchable and compact on phones', () => {
    expect(battleCss).toContain('height:100dvh');
    expect(battleCss).toContain('safe-area-inset-top');
    expect(battleCss).toContain('safe-area-inset-bottom');
    expect(battleCss).toContain('min-height:44px');
    expect(battleCss).toContain('touch-action:manipulation');
    expect(battleCss).toContain('@media(max-width:390px)');
  });

  it('keeps the tactical entry above device safe areas with 44px touch targets', () => {
    expect(expeditionCss).toContain('safe-area-inset-right');
    expect(expeditionCss).toContain('safe-area-inset-bottom');
    expect(expeditionCss).toContain('min-height:44px');
    expect(expeditionCss).toContain('touch-action:manipulation');
    expect(expeditionCss).toContain('overscroll-behavior:contain');
    expect(expeditionCss).toContain('@media(max-width:460px)');
  });
});