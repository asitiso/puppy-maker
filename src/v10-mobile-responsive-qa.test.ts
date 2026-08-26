// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync(new URL('./mobile-v10-guidance.css',import.meta.url),'utf8');

describe('V10 mobile guidance responsive/accessibility contracts',()=>{
  it('covers the required compact mobile widths and long Korean wrapping',()=>{
    expect(css).toMatch(/max-width:\s*430px/);
    expect(css).toMatch(/max-width:\s*390px/);
    expect(css).toMatch(/max-height:\s*640px/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('keeps primary actions thumb-safe and above the bottom safe area',()=>{
    expect(css).toMatch(/min-height:\s*(48|5[0-2])px/);
    expect(css).toContain('env(safe-area-inset-bottom');
  });

  it('provides keyboard focus and reduced-motion fallbacks without introducing a nested page scroller',()=>{
    expect(css).toContain(':focus-visible');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).not.toMatch(/\.v10-[^{]+\{[^}]*overflow-y:\s*(auto|scroll)/s);
  });
});
