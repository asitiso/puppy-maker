import {describe,expect,it} from 'vitest';
// @ts-ignore -- Vitest executes this contract test in Node; keep Node types out of app dependencies.
import {readFileSync} from 'node:fs';
import app from './App.tsx?raw';
import root from './Root.tsx?raw';
import home from './LayeredHome.tsx?raw';

const css=readFileSync(new URL('./weekly-planner.css',import.meta.url),'utf8');

describe('V4 Living Year home integration',()=>{
  it('uses the authoritative guided-action selector instead of duplicating reward priority in LayeredHome',()=>{
    expect(home).toContain("from './hub-next-action'");
    expect(home).toContain('hubGuidedActionStack(state)');
    expect(home).toContain('<HomeCommandCenter');
    expect(home).not.toContain('const primaryTask = unclaimedMail.length > 0');
  });

  it('renders the Weekly Planner and routes the selector through the existing home destinations',()=>{
    expect(home).toContain('<WeeklyPlannerCard');
    for(const route of ['weekly_planner','advance_week','schedule','outing','bond','expedition','tactical','season']) expect(home).toContain(`'${route}'`);
  });

  it('threads weekly actions from App reducer dispatch through Root into LayeredHome without storing callbacks as React updaters',()=>{
    expect(app).toContain("type:'SELECT_WEEKLY_FOCUS'");
    expect(app).toContain("type:'COMPLETE_WEEKLY_FOCUS'");
    expect(app).toContain("type:'ADVANCE_WEEK'");
    expect(root).toContain('const captureWeeklyFocus');
    expect(root).toContain('setSelectWeeklyFocus(() => next)');
    expect(root).toContain('onWeeklyFocusReady={captureWeeklyFocus}');
    expect(root).toContain('onWeeklyFocus={handleWeeklyFocus}');
    expect(root).toContain('onCompleteWeek={handleCompleteWeek}');
    expect(root).toContain('onAdvanceWeek={handleAdvanceWeek}');
  });

  it('keeps the planner mobile-safe, touch-sized, keyboard-visible and reduced-motion aware',()=>{
    expect(css).toContain('.weekly-planner-card');
    expect(css).toContain('.weekly-focus-grid');
    expect(css).toContain('min-height:44px');
    expect(css).toContain('@media(max-width:430px)');
    expect(css).toContain('@media(max-width:390px)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain(':focus-visible');
  });
});
