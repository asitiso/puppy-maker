import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import home from './LayeredHome.tsx?raw';

const mobileCss = readFileSync(new URL('./layered-home-mobile.css', import.meta.url), 'utf8');

describe('Hub HUD density', () => {
  it('uses the mobile currency lane for the two values actually rendered', () => {
    const currencyMarkup = home.match(/className="lh-currency-values"[^>]*>(.*?)<\/div><div className="lh-hp"/s)?.[1] ?? '';
    expect(currencyMarkup.match(/<span>/g)?.length).toBe(2);
    expect(mobileCss).toContain('@media(max-width:430px)');
    expect(mobileCss).toContain('.layered-home .lh-currency-values{grid-template-columns:repeat(2,1fr)}');
  });
});