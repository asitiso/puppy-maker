// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const css=readFileSync(new URL('./scene/scene.css',import.meta.url),'utf8');
const objectSource=readFileSync(new URL('./scene/InteractiveObject.tsx',import.meta.url),'utf8');
const mapSource=readFileSync(new URL('./scene/WorldMapScene.tsx',import.meta.url),'utf8');

describe('V14 scene mobile and accessibility QA',()=>{
  it('covers 360, 390 and 430-class phones with compact height handling',()=>{
    expect(css).toMatch(/@media\(max-width:430px\)/);
    expect(css).toMatch(/@media\(max-height:640px\)/);
    expect(css).toContain('overflow-wrap:anywhere');
    expect(css).toContain('grid-template-columns:1fr');
  });

  it('keeps scene and map controls touch-safe and keyboard-visible',()=>{
    expect(css).toMatch(/min-width:44px;min-height:44px/);
    expect(css).toContain(':focus-visible');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(objectSource).toContain('aria-label={interaction.label}');
    expect(objectSource).toContain('aria-disabled={!interaction.enabled}');
    expect(mapSource).toContain('aria-disabled={!destination.unlocked}');
  });

  it('turns off hint motion when the user prefers reduced motion',()=>{
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toMatch(/prefers-reduced-motion:reduce[^}]*transition:none/s);
    expect(css).toMatch(/prefers-reduced-motion:reduce[\s\S]*animation:none/);
  });
});
