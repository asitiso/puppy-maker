import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import overlay from './YearEndCeremonyOverlay.tsx?raw';

const css = readFileSync(new URL('./year-end-ceremony.css', import.meta.url), 'utf8');

describe('Year End ceremony modal UI contract', () => {
  it('contains keyboard focus without turning Escape into acknowledgement', () => {
    expect(overlay).toContain("import { trapModalTab } from './modal-focus';");
    expect(overlay).toContain('onKeyDown={trapModalTab}');
    expect(overlay).toContain('<button autoFocus onClick={close}>새로운 해 시작</button>');
    expect(overlay).not.toContain("event.key !== 'Escape'");
  });

  it('keeps the ceremony inside the visual viewport with a 44px primary action', () => {
    expect(css).toContain('.year-end-backdrop{position:fixed');
    expect(css).toContain('safe-area-inset-top');
    expect(css).toContain('safe-area-inset-bottom');
    expect(css).toContain('max-height:calc(100dvh');
    expect(css).toContain('min-height:44px');
  });
});
