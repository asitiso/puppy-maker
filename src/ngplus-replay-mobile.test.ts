// @ts-ignore node fs types are not included in this app tsconfig
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./ngplus-replay.css', import.meta.url), 'utf8');

describe('NG+ replay mobile/accessibility contract', () => {
  it('keeps dynamic viewport, safe areas, touch targets and Korean wrapping', () => {
    expect(css).toMatch(/min-height\s*:\s*100vh/);
    expect(css).toMatch(/min-height\s*:\s*100dvh/);
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toMatch(/min-height\s*:\s*44px/);
    expect(css).toContain('overflow-wrap:anywhere');
    expect(css).toContain('word-break:keep-all');
  });

  it('has explicit 360, 390 and 430 width contracts', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*360px\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*390px\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*430px\)/);
  });

  it('respects reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation:none!important');
    expect(css).toContain('transition:none!important');
  });
});
