import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import archive from './CollectionArchiveOverlay.tsx?raw';

const css = readFileSync(new URL('./collection-archive.css', import.meta.url), 'utf8');

describe('Collection Archive modal keyboard contract', () => {
  it('matches the major Hub modal keyboard round trip', () => {
    expect(archive).toContain("import { trapModalTab } from './modal-focus';");
    expect(archive).toContain('launcherRef');
    expect(archive).toContain('launcherRef.current?.focus()');
    expect(archive).toContain("event.key !== 'Escape'");
    expect(archive).toContain("window.addEventListener('keydown'");
    expect(archive).toContain("window.removeEventListener('keydown'");
    expect(archive).toContain('ref={launcherRef}');
    expect(archive).toContain('autoFocus className="collection-archive-close"');
    expect(archive).toContain('onKeyDown={trapModalTab}');
  });

  it('keeps the archive modal inside the visual viewport with a usable close target', () => {
    expect(css).toContain('.collection-archive-backdrop{position:fixed');
    expect(css).toContain('safe-area-inset-top');
    expect(css).toContain('safe-area-inset-bottom');
    expect(css).toContain('.collection-archive-close{');
    expect(css).toContain('min-width:44px');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('max-height:calc(100dvh');
  });
});
