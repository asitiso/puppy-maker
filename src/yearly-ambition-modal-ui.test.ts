import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import overlay from './YearlyAmbitionOverlay.tsx?raw';

const css = readFileSync(new URL('./yearly-ambition.css', import.meta.url), 'utf8');

describe('Yearly Ambition modal UI contract', () => {
  it('contains focus and only lets Escape close optional details', () => {
    expect(overlay).toContain("import { trapModalTab } from './modal-focus';");
    expect(overlay).toContain('launcherRef');
    expect(overlay).toContain('launcherRef.current?.focus()');
    expect(overlay).toContain("if (!detailsOpen) return;");
    expect(overlay).toContain("event.key !== 'Escape'");
    expect(overlay).toContain("window.addEventListener('keydown'");
    expect(overlay).toContain('ref={launcherRef}');
    expect(overlay).toContain('onKeyDown={trapModalTab}');
    expect(overlay).toContain('autoFocus className="yearly-ambition-close"');
    expect(overlay).toContain('autoFocus={!selected && index === 0}');
  });

  it('keeps the ambition modal inside the visual viewport with 44px controls', () => {
    expect(css).toContain('.yearly-ambition-backdrop{position:fixed');
    expect(css).toContain('safe-area-inset-top');
    expect(css).toContain('safe-area-inset-bottom');
    expect(css).toContain('max-height:calc(100dvh');
    expect(css).toContain('min-width:44px');
    expect(css).toContain('min-height:44px');
  });
});
