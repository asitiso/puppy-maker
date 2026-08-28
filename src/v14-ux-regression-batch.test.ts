// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const homeCss=readFileSync(new URL('./mobile-v10-guidance.css',import.meta.url),'utf8');
const tacticalSource=readFileSync(new URL('./TacticalExpeditionFlow.tsx',import.meta.url),'utf8');
const tacticalCss=readFileSync(new URL('./tactical-expedition-flow.css',import.meta.url),'utf8');
const buildCss=readFileSync(new URL('./v12-build-editor.css',import.meta.url),'utf8');
const appSource=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
const trainingCss=readFileSync(new URL('./training-minigames.css',import.meta.url),'utf8');
const weeklyCss=readFileSync(new URL('./weekly-planner.css',import.meta.url),'utf8');

describe('reported V14 mobile UX regressions',()=>{
  it('moves the home alert rail away from the center character/action lane',()=>{
    const rule=homeCss.match(/\.layered-home \.v10-command-center\{[^}]+\}/)?.[0]??'';
    expect(rule).toContain('top:25');
    expect(rule).toContain('left:max(');
    expect(rule).not.toContain('left:50%');
    expect(rule).toContain('transform:none');
  });

  it('keeps Guardian Expedition start CTA outside the scrolling setup body',()=>{
    expect(tacticalSource).toContain('className="tactical-expedition-entry-scroll"');
    expect(tacticalCss).toContain('grid-template-rows:minmax(0,1fr) auto');
    expect(tacticalCss).toMatch(/\.tactical-expedition-entry-scroll\{[^}]*overflow-y:auto/);
    expect(tacticalCss).toMatch(/\.tactical-setup-actions\{[^}]*position:relative/);
  });

  it('turns Character Build editing into a focused overlay with its own exit',()=>{
    const rule=buildCss.match(/\.v12-build-editor\{[^}]+\}/)?.[0]??'';
    expect(rule).toContain('position:fixed');
    expect(rule).toContain('inset:');
    expect(rule).toContain('z-index:');
    expect(rule).toContain('overflow-y:auto');
  });

  it('routes scheduled training through activity-specific minigames',()=>{
    expect(appSource).toContain("TrainingActivityMinigame from './TrainingActivityMinigame'");
    expect(appSource).toContain('<TrainingActivityMinigame');
  });

  it('keeps schedule-image button labels readable on phones',()=>{
    expect(trainingCss).toMatch(/\.screen\.schedule-screen \.activity-palette button\{[^}]*min-height:48px[^}]*font-size:13px/);
    expect(weeklyCss).not.toMatch(/\.weekly-focus-grid button[^}]*font-size:(?:8|9|10)px/);
    expect(weeklyCss).toMatch(/\.weekly-focus-grid button[^}]*font-size:12px/);
  });
});
