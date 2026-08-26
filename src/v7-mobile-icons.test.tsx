import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
// @ts-ignore -- Vitest executes source contracts in Node; app tsconfig intentionally excludes Node globals.
import { readFileSync } from 'node:fs';
import MobileNavIcon,{type MobileNavIconName} from './MobileNavIcon';

const css = readFileSync(new URL('./layered-home-v7.css', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('./mobile-ui-tokens.css', import.meta.url), 'utf8');
const icons:MobileNavIconName[]=['home','life','growth','adventure','bond','records'];

describe('V7 mobile design system contracts', () => {
  it('imports the shared mobile UI token layer', () => {
    expect(css).toContain("@import './mobile-ui-tokens.css'");
    for(const token of ['--ui-text-caption:12px','--ui-text-small:13px','--ui-text-body:15px','--ui-text-button:15px','--ui-text-title:21px','--ui-touch-min:44px','--ui-control-primary:52px']) expect(tokens).toContain(token);
  });

  it('renders all six category icons as consistent currentColor SVGs', () => {
    for(const icon of icons){
      const markup=renderToStaticMarkup(<MobileNavIcon name={icon}/>);
      expect(markup).toContain('viewBox="0 0 24 24"');
      expect(markup).toContain('stroke="currentColor"');
      expect(markup).toContain('stroke-width="1.9"');
    }
  });

  it('uses readable tokenized primary and navigation labels', () => {
    expect(css).toContain('.lh-primary-action b{font-size:var(--ui-text-subtitle)');
    expect(css).toContain('.v7-bottom-nav b{font-size:var(--ui-text-button)');
    expect(css).not.toMatch(/\.v7-bottom-nav b\{[^}]*font-size:(?:8|9|10|11|12|13)px/);
  });
});
