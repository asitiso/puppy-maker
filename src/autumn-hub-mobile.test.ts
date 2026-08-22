// @ts-ignore -- Vitest runs under Node while the app tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./autumn-hub.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('./AutumnHubOverlay.tsx', import.meta.url), 'utf8');

describe('Autumn Hub mobile/accessibility contract', () => {
  it('supports 360/390/430, safe areas, dvh fallback, Korean wrapping and 44px controls', () => {
    expect(css).toMatch(/max-width:\s*430px/);
    expect(css).toMatch(/max-width:\s*390px/);
    expect(css).toMatch(/max-width:\s*360px/);
    expect(css).toMatch(/100dvh/);
    expect(css).toMatch(/92vh/);
    expect(css).toMatch(/safe-area-inset-top/);
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/word-break:\s*keep-all/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('keeps the modal bounded with scroll trap, focus visibility and reduced-motion support', () => {
    expect(css).toMatch(/overflow-y:\s*auto/);
    expect(css).toMatch(/overscroll-behavior:\s*contain/);
    expect(css).toMatch(/focus-visible/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain("event.key !== 'Tab'");
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('aria-modal="true"');
  });

  it('marks locked Major Choice options as unavailable without exposing numeric requirements', () => {
    expect(source).toContain('aria-disabled={!option.available}');
    expect(source).toContain('disabled={!option.available || Boolean(model.majorChoice.committedChoiceId)}');
    expect(source).not.toMatch(/affinity|rawScore|trustScore|requirementScore/i);
  });
});
