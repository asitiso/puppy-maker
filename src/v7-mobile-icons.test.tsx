import { describe, expect, it } from 'vitest';
// @ts-ignore -- Vitest executes source contracts in Node; app tsconfig intentionally excludes Node globals.
import { readFileSync } from 'node:fs';

const homeSource = readFileSync(new URL('./LayeredHome.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./layered-home.css', import.meta.url), 'utf8');

describe('V7 mobile design system contracts', () => {
  it('imports the shared mobile UI token layer', () => {
    expect(css).toContain("@import './mobile-ui-tokens.css'");
  });

  it('uses semantic mobile icon names in the home shell', () => {
    for (const icon of ['home', 'life', 'growth', 'adventure', 'bond', 'records']) {
      expect(homeSource).toContain(`'${icon}'`);
    }
  });

  it('removes important 8px and 9px home action labels', () => {
    expect(css).not.toMatch(/\.lh-primary-action[^}]*font-size:(?:8|9)px/);
    expect(css).toContain('--ui-text-button');
  });
});
