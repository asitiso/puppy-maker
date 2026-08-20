import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8');

describe('Layered Home mobile UI contract', () => {
  const home = source('./LayeredHome.tsx');
  const homeCss = source('./layered-home.css');
  const panelCss = source('./home-panels.css');

  it('exposes one prominent current-task action on the home scene', () => {
    expect(home).toContain('className="lh-primary-action"');
    expect(home).toContain('지금 할 일');
  });

  it('marks only an opened bottom destination as current', () => {
    expect(home).toContain('useState(-1)');
    expect(home).toContain("aria-current={activeNav === index ? 'page' : undefined}");
    expect(home).toContain('setActiveNav(-1);');
  });

  it('keeps panel navigation visible while long content scrolls independently', () => {
    expect(home).toContain('className="lh-panel-header"');
    expect(panelCss).toMatch(/\.lh-panel-list\{[^}]*overflow-y:auto/);
  });

  it('provides clear focus feedback for touch controls used with a keyboard', () => {
    expect(homeCss).toContain(':focus-visible');
  });
});
