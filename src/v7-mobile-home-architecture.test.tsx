import { describe, expect, it } from 'vitest';
// @ts-ignore -- Vitest executes this contract in Node; app tsconfig intentionally excludes Node globals.
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./LayeredHome.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./layered-home.css', import.meta.url), 'utf8');

describe('V7 mobile home information architecture', () => {
  it('uses six clear semantic bottom categories', () => {
    for (const label of ['홈', '생활', '성장', '모험', '인연', '기록']) expect(source).toContain(label);
  });

  it('keeps exactly one authoritative primary action', () => {
    expect((source.match(/className="lh-primary-action"/g) ?? []).length).toBe(1);
    expect(source).toContain('hubNextAction(state)');
  });

  it('removes legacy always-visible shortcut and promo clusters from the default home', () => {
    expect(source).not.toContain('className="lh-shortcuts"');
    expect(source).not.toContain('className="lh-promos"');
    expect(source).not.toContain('className="lh-goal"');
  });

  it('does not mount the full weekly planner permanently on the home scene', () => {
    expect(source).not.toContain('className="lh-weekly-planner"');
  });

  it('reserves readable mobile controls', () => {
    expect(css).toContain('min-height:52px');
  });
});
