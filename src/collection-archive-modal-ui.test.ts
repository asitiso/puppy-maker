import { describe, expect, it } from 'vitest';
import archive from './CollectionArchiveOverlay.tsx?raw';

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
});
