import { describe, expect, it } from 'vitest';
// @ts-ignore -- Node contract test; keep Node types out of app dependencies.
import { readFileSync } from 'node:fs';
import home from './LayeredHome.tsx?raw';

const css = readFileSync(new URL('./layered-home.css', import.meta.url), 'utf8');

describe('Hub HUD density', () => {
  it('uses the available currency lane for the two values actually rendered', () => {
    const currencyMarkup = home.match(/className="lh-currency-values"[^>]*>(.*?)<\/div><div className="lh-hp"/s)?.[1] ?? '';
    expect(currencyMarkup.match(/<span>/g)?.length).toBe(2);
    expect(css).toContain('.lh-currency-values{position:absolute;left:7%;right:7%;top:15%;display:grid;grid-template-columns:repeat(2,1fr)');
  });
});