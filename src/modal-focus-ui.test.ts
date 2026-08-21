import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import raisingOverlay from './RaisingIdentityOverlay.tsx?raw';
import worldOverlay from './WorldProgressOverlay.tsx?raw';
import seasonOverlay from './SeasonLiveOpsOverlay.tsx?raw';
import expeditionOverlay from './GuardianExpeditionOverlay.tsx?raw';

const helper = readFileSync(new URL('./modal-focus.ts', import.meta.url), 'utf8');

describe('modal keyboard focus containment', () => {
  it('wraps Tab and Shift+Tab at modal boundaries', () => {
    expect(helper).toContain("event.key !== 'Tab'");
    expect(helper).toContain('event.shiftKey');
    expect(helper).toContain('event.preventDefault()');
    expect(helper).toContain('last.focus()');
    expect(helper).toContain('first.focus()');
  });

  it('attaches the shared trap only to major modal surfaces', () => {
    for (const overlay of [raisingOverlay, worldOverlay, seasonOverlay, expeditionOverlay]) {
      expect(overlay).toContain("from './modal-focus'");
      expect(overlay).toContain('onKeyDown={trapModalTab}');
    }
  });
});