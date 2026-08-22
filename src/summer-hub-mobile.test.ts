import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const cssPath = path.join(process.cwd(), 'src', 'summer-hub.css');
const css = () => fs.readFileSync(cssPath, 'utf8');

describe('Summer Hub mobile/accessibility contract', () => {
  it('keeps explicit 360, 390 and 430 mobile breakpoints', () => {
    const source = css();
    expect(source).toContain('@media (max-width: 430px)');
    expect(source).toContain('@media (max-width: 390px)');
    expect(source).toContain('@media (max-width: 360px) and (max-height: 650px)');
  });

  it('uses viewport fallback, 100dvh support and safe-area padding', () => {
    const source = css();
    expect(source).toContain('92vh');
    expect(source).toContain('100dvh');
    expect(source).toContain('env(safe-area-inset-top)');
    expect(source).toContain('env(safe-area-inset-bottom)');
  });

  it('keeps 44px touch targets, Korean wrapping, internal scrolling and reduced motion', () => {
    const source = css();
    expect(source).toContain('min-height: 44px');
    expect(source).toContain('word-break: keep-all');
    expect(source).toContain('overflow-wrap: anywhere');
    expect(source).toContain('overscroll-behavior: contain');
    expect(source).toContain('prefers-reduced-motion: reduce');
  });
});
