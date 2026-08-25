import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer} from './game';
import {emptyWeeklyLifeState} from './weekly-life';
import {weekKey} from './weekly-calendar';

describe('V4 Living Year reducer integration',()=>{
  it('hydrates old V3 saves with an empty weekly-life slice',()=>{
    const legacy={...initialState} as Record<string,unknown>;
    delete legacy.weeklyLife;
    expect(hydrateGameState(legacy).weeklyLife).toEqual(emptyWeeklyLifeState());
  });

  it('selects and resolves one focus for the current week exactly once',()=>{
    const selected=reducer(initialState,{type:'SELECT_WEEKLY_FOCUS',focus:'world'});
    const current=weekKey(selected.year,selected.month,selected.week);
    expect(selected.weeklyLife).toMatchObject({focusKey:current,focus:'world',completedWeekKey:null});

    const resolved=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
    expect(resolved.weeklyLife.completedWeekKey).toBe(current);
    expect(resolved.weeklyLife.lastEvent).toBe('guardian_patrol');
    expect(resolved.weeklyLife.resolvedEventKeys).toEqual([`${current}:guardian_patrol`]);
    expect(resolved.stats.morality).toBe(selected.stats.morality+1);
    expect(resolved.stats.fatigue).toBe(selected.stats.fatigue+1);

    expect(reducer(resolved,{type:'COMPLETE_WEEKLY_FOCUS'})).toBe(resolved);
  });

  it('advances weeks 1 through 4 without settling a month early',()=>{
    const week1={...initialState,week:1,weeklyLife:emptyWeeklyLifeState()};
    const selected=reducer(week1,{type:'SELECT_WEEKLY_FOCUS',focus:'rest'});
    const completed=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
    const next=reducer(completed,{type:'ADVANCE_WEEK'});
    expect(next.year).toBe(week1.year);
    expect(next.month).toBe(week1.month);
    expect(next.week).toBe(2);
    expect(next.gold).toBe(completed.gold);
    expect(next.weeklyLife.focus).toBeNull();
    expect(next.weeklyLife.completedWeekKey).toBeNull();
    expect(next.weeklyLife.resolvedEventKeys.length).toBe(1);
  });

  it('uses the existing month transition exactly once after week four',()=>{
    const week4={
      ...initialState,
      week:4,
      growthStreak:0,
      monthlyCounters:{trainings:1,outings:2,gifts:1},
      rewardedMonthlyMissions:['training_once','outing_twice','gift_once'] as typeof initialState.rewardedMonthlyMissions,
      weeklyLife:emptyWeeklyLifeState(),
    };
    const selected=reducer(week4,{type:'SELECT_WEEKLY_FOCUS',focus:'season'});
    const completed=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
    const next=reducer(completed,{type:'ADVANCE_WEEK'});
    expect(next.month).toBe(initialState.month+1);
    expect(next.week).toBe(1);
    expect(next.growthStreak).toBe(1);
    expect(next.monthlyCounters).toEqual({trainings:0,outings:0,gifts:0});
    expect(next.weeklyLife.focus).toBeNull();
  });

  it('rejects advance before the current week has been resolved',()=>{
    const selected=reducer(initialState,{type:'SELECT_WEEKLY_FOCUS',focus:'bond'});
    expect(reducer(selected,{type:'ADVANCE_WEEK'})).toBe(selected);
  });
});
