import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test only.
import { readFileSync } from 'node:fs';
import overlay from './SpringHubOverlay.tsx?raw';

const css = readFileSync(new URL('./spring-hub.css', import.meta.url), 'utf8');

describe('Spring Hub mobile/accessibility contract', () => {
  it('supports 360, 390 and 430 class widths without expanding home complexity', () => {
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-width:390px)');
    expect(css).toContain('@media(max-width:360px) and (max-height:650px)');
    expect(css).toContain('.spring-home-entry dl{display:none}');
  });

  it('uses dynamic viewport and safe areas while preserving a vh fallback', () => {
    expect(css).toContain('height:min(92vh,860px)');
    expect(css).toContain('@supports(height:100dvh)');
    expect(css).toContain('height:min(92dvh,860px)');
    expect(css).toContain('safe-area-inset-top');
    expect(css).toContain('safe-area-inset-bottom');
  });

  it('keeps controls at least 44px and Korean copy wrap-safe', () => {
    expect(css).toContain('min-height:44px');
    expect(css).toContain('word-break:keep-all');
    expect(css).toContain('overflow-wrap:anywhere');
    expect(css).toContain('touch-action:manipulation');
  });

  it('traps modal scrolling and keeps the long Journey content independently scrollable', () => {
    expect(overlay).toContain("document.body.style.overflow = 'hidden'");
    expect(css).toContain('overflow-y:auto');
    expect(css).toContain('overflow-x:hidden');
    expect(css).toContain('touch-action:pan-y');
    expect(css).toContain('overscroll-behavior:contain');
  });

  it('supports ESC, Tab containment, initial close focus and launcher focus return', () => {
    expect(overlay).toContain("event.key === 'Escape'");
    expect(overlay).toContain("event.key !== 'Tab'");
    expect(overlay).toContain('closeRef.current?.focus()');
    expect(overlay).toContain('launcherRef.current?.focus()');
    expect(overlay).toContain('aria-modal="true"');
  });

  it('uses a dedicated modal layer and visible keyboard focus', () => {
    expect(css).toContain('z-index:176');
    expect(css).toContain(':focus-visible');
  });

  it('honors reduced motion', () => {
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain('animation-duration:.01ms!important');
    expect(css).toContain('transition-duration:.01ms!important');
  });
});
