import { describe, expect, it } from 'vitest';
import expedition from './GuardianExpeditionOverlay.tsx?raw';

describe('Guardian Expedition modal accessibility', () => {
  it('exposes map, battle, and result views as modal dialogs', () => {
    expect(expedition).toContain('className="expedition-map" role="dialog" aria-modal="true" aria-label="수호자 원정"');
    expect(expedition).toContain('className="expedition-battle" role="dialog" aria-modal="true"');
    expect(expedition).toContain('className="expedition-result" role="dialog" aria-modal="true"');
  });
});