import { describe, expect, it } from 'vitest';
// @ts-ignore Node builtin is used only by this Vitest contract test.
import { readFileSync } from 'node:fs';

const battleCss = readFileSync(new URL('./tactical-battle.css', import.meta.url),'utf8');
const expeditionCss = readFileSync(new URL('./tactical-expedition-flow.css', import.meta.url),'utf8');

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