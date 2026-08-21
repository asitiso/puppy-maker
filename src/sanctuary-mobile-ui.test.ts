import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./sanctuary.css', import.meta.url), 'utf8');

describe('Sanctuary mobile modal contract', () => {
  it('keeps the fixed Sanctuary surface inside safe areas with a usable close target', () => {
    expect(css).toContain('.sanctuary-backdrop{position:fixed');
    expect(css).toContain('safe-area-inset-top');
    expect(css).toContain('safe-area-inset-bottom');
    expect(css).toContain('max-height:calc(100dvh');
    expect(css).toContain('.sanctuary-content header>button{');
    expect(css).toContain('min-width:44px');
    expect(css).toContain('min-height:44px');
  });
});
