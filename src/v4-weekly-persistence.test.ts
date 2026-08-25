import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer} from './game';
import {hydrateSave,serializeGameState} from './game/save';
import {emptyWeeklyLifeState} from './weekly-life';
import {weekKey} from './weekly-calendar';

describe('V4 weekly life persistence hardening',()=>{
  it('keeps a valid current-week selection stable across save and reload',()=>{
    const selected=reducer(initialState,{type:'SELECT_WEEKLY_FOCUS',focus:'bond'});
    const hydrated=hydrateSave(serializeGameState(selected));
    expect(hydrated.week).toBe(selected.week);
    expect(hydrated.weeklyLife).toEqual(selected.weeklyLife);
  });

  it('clears stale current-run weekly markers while preserving bounded resolution history',()=>{
    const current=weekKey(initialState.year,initialState.month,initialState.week);
    const stale=weekKey(initialState.year,initialState.month,initialState.week===1?2:1);
    const hydrated=hydrateGameState({
      ...initialState,
      weeklyLife:{
        focusKey:stale,
        focus:'world',
        completedWeekKey:stale,
        resolvedEventKeys:[`${stale}:guardian_patrol`,`${current}:market_day`],
        lastEvent:'guardian_patrol',
      },
    });
    expect(hydrated.weeklyLife).toEqual({
      focusKey:null,
      focus:null,
      completedWeekKey:null,
      resolvedEventKeys:[`${stale}:guardian_patrol`,`${current}:market_day`],
      lastEvent:null,
    });
  });

  it('sanitizes malformed and partial weekly state without blocking progression',()=>{
    const hydrated=hydrateGameState({
      ...initialState,
      weeklyLife:{focusKey:'bad',focus:'hack',completedWeekKey:'1-99-8',resolvedEventKeys:['bad',null,`${weekKey(initialState.year,initialState.month,initialState.week)}:market_day`],lastEvent:'hack'},
    });
    expect(hydrated.weeklyLife.focus).toBeNull();
    expect(hydrated.weeklyLife.completedWeekKey).toBeNull();
    expect(hydrated.weeklyLife.resolvedEventKeys).toEqual([`${weekKey(initialState.year,initialState.month,initialState.week)}:market_day`]);
    const selected=reducer(hydrated,{type:'SELECT_WEEKLY_FOCUS',focus:'rest'});
    expect(selected.weeklyLife.focus).toBe('rest');
  });

  it('reconciles weekly state against the sanitized calendar instead of malformed raw dates',()=>{
    const hydrated=hydrateGameState({
      ...initialState,
      year:Number.POSITIVE_INFINITY,
      month:-10,
      week:99,
      weeklyLife:{focusKey:'1-4-4',focus:'training',completedWeekKey:'1-4-4',resolvedEventKeys:[],lastEvent:'training_partner'},
    });
    const current=weekKey(hydrated.year,hydrated.month,hydrated.week);
    expect(current).toBe(weekKey(initialState.year,1,4));
    expect(hydrated.weeklyLife).toEqual(emptyWeeklyLifeState());
  });

  it('does not duplicate a completed weekly effect after reload',()=>{
    const selected=reducer(initialState,{type:'SELECT_WEEKLY_FOCUS',focus:'world'});
    const completed=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
    const reloaded=hydrateSave(serializeGameState(completed));
    const repeated=reducer(reloaded,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(repeated).toBe(reloaded);
    expect(repeated.gold).toBe(completed.gold);
    expect(repeated.stats).toEqual(completed.stats);
    expect(repeated.weeklyLife.resolvedEventKeys).toEqual(completed.weeklyLife.resolvedEventKeys);
  });
});
