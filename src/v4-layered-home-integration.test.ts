import {describe,expect,it} from 'vitest';
import app from './App.tsx?raw';
import root from './Root.tsx?raw';
import home from './LayeredHome.tsx?raw';
import css from './layered-home.css?raw';

describe('V4 Living Year home integration',()=>{
  it('uses the authoritative hub selector instead of duplicating reward priority in LayeredHome',()=>{
    expect(home).toContain("from './hub-next-action'");
    expect(home).toContain('hubNextAction(state)');
    expect(home).not.toContain('const primaryTask = unclaimedMail.length > 0');
  });

  it('renders the Weekly Planner and routes the selector through the existing home destinations',()=>{
    expect(home).toContain('<WeeklyPlannerCard');
    for(const route of ['weekly_planner','advance_week','schedule','outing','bond','expedition','tactical','season']) expect(home).toContain(`'${route}'`);
  });

  it('threads weekly actions from App reducer dispatch through Root into LayeredHome',()=>{
    expect(app).toContain("type:'SELECT_WEEKLY_FOCUS'");
    expect(app).toContain("type:'COMPLETE_WEEKLY_FOCUS'");
    expect(app).toContain("type:'ADVANCE_WEEK'");
    expect(root).toContain('onWeeklyFocusReady={setSelectWeeklyFocus}');
    expect(root).toContain('onWeeklyFocus={focus => selectWeeklyFocus?.(focus)}');
    expect(root).toContain('onCompleteWeek={() => completeWeeklyFocus?.()}');
    expect(root).toContain('onAdvanceWeek={() => advanceWeek?.()}');
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
