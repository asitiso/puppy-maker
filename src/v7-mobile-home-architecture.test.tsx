import { describe, expect, it } from 'vitest';
// @ts-ignore -- Vitest executes this contract in Node; app tsconfig intentionally excludes Node globals.
import { readFileSync } from 'node:fs';

const root = readFileSync(new URL('./Root.tsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./LayeredHomeV7.tsx', import.meta.url), 'utf8');
const categories = readFileSync(new URL('./MobileCategorySheet.tsx', import.meta.url), 'utf8');
const legacyHome = readFileSync(new URL('./LayeredHome.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./layered-home-v7.css', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('./mobile-ui-tokens.css', import.meta.url), 'utf8');

describe('V7 mobile home information architecture compatibility', () => {
  it('keeps the V7 home principles while the V8 router owns the real entrypoint', () => {
    expect(root).toContain("import MobileRouterChrome from './MobileRouterChrome'");
    expect(root).toContain("import MobileCategoryPage from './MobileCategoryPage'");
    expect(root).toContain('<MobileRouterChrome');
    expect(root).not.toContain('<LayeredHomeV7');
  });

  it('uses six clear semantic bottom categories', () => {
    for (const label of ['홈', '생활', '성장', '모험', '인연', '기록']) expect(categories).toContain(`label:'${label}'`);
    expect(shell).toContain('mobileCategories.map');
  });

  it('keeps exactly one authoritative guided primary action implementation', () => {
    expect((legacyHome.match(/<HomeCommandCenter/g) ?? []).length).toBe(1);
    expect(legacyHome).toContain('hubGuidedActionStack(state)');
    expect(shell).toContain('hubGuidedActionStack(state).primary');
    expect(shell).toContain("closest('.v10-command-primary .v10-guided-cta')");
  });

  it('hides legacy shortcut, promo, goal, planner and bottom-nav clutter from the visible V7 home', () => {
    for (const selector of ['.lh-shortcuts','.lh-promos','.lh-goal','.lh-weekly-planner','.lh-bottom-nav']) {
      expect(css).toContain(selector);
    }
    expect(css).toContain('display:none!important');
  });

  it('moves weekly planning and chronicles behind semantic category disclosure', () => {
    expect(shell).not.toContain("from './WeeklyPlannerCard'");
    expect(categories).toContain('<WeeklyPlannerCard');
    expect(categories).toContain('<LineageChronicle');
    expect(categories).toContain('<WorldChronicle');
  });

  it('reserves readable mobile controls', () => {
    expect(tokens).toContain('--ui-control-primary:52px');
    expect(tokens).toContain('--ui-touch-min:44px');
    expect(css).toContain('min-height:var(--ui-control-primary)');
  });
});
