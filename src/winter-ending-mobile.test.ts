// @ts-ignore -- Vitest runs under Node while app tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./winter-ending.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('./WinterEndingHub.tsx', import.meta.url), 'utf8');

describe('Winter ending mobile/accessibility contract', () => {
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

  it('keeps the ending dialog bounded with ESC, focus trap, focus visibility and reduced motion', () => {
    expect(css).toMatch(/overflow-y:\s*auto/);
    expect(css).toMatch(/overscroll-behavior:\s*contain/);
    expect(css).toMatch(/focus-visible/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain("event.key !== 'Tab'");
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('aria-modal="true"');
  });

  it('does not expose raw affinity, numeric trust or career-score gauges in presentation source', () => {
    expect(source).not.toMatch(/campaignAffinities|trustScore|careerScore|rawScore|requirementScore/i);
  });
});
