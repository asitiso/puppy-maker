import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer} from './game';
import {weeklyDirectiveKey,weeklyDirectives} from './weekly-directives';
import {astralRiftWeeklyKey,astralRiftWeeklyDirectives} from './astral-rift-weekly';
import {convergenceWeeklyKey,convergenceWeeklyDirectives} from './convergence-weekly';
import {emptyWeeklyLifeState} from './weekly-life';

function finishAndAdvance(state:typeof initialState){
  const selected=reducer(state,{type:'SELECT_WEEKLY_FOCUS',focus:'rest'});
  const completed=reducer(selected,{type:'COMPLETE_WEEKLY_FOCUS'});
  return reducer(completed,{type:'ADVANCE_WEEK'});
}

function keys(state:Pick<typeof initialState,'year'|'month'|'week'>){
  return {
    directive:weeklyDirectiveKey(state.year,state.month,state.week),
    rift:astralRiftWeeklyKey(state.year,state.month,state.week),
    convergence:convergenceWeeklyKey(state.year,state.month,state.week),
  };
}

describe('V4 real-week subsystem boundaries',()=>{
  it('moves Weekly Directive, Astral Rift and Convergence to the same new key after a normal week',()=>{
    const week1={...initialState,year:1,month:4,week:1,weeklyLife:emptyWeeklyLifeState()};
    const before=keys(week1);
    const next=finishAndAdvance(week1);
    expect(next).toMatchObject({year:1,month:4,week:2});
    expect(keys(next)).toEqual({directive:'1-4-2',rift:'1-4-2',convergence:'1-4-2'});
    expect(keys(next)).not.toEqual(before);
    expect(weeklyDirectives(1,4,2)).not.toEqual(weeklyDirectives(1,4,1));
    expect(astralRiftWeeklyDirectives(1,4,2)).not.toEqual(astralRiftWeeklyDirectives(1,4,1));
    expect(convergenceWeeklyDirectives(1,4,2)).not.toEqual(convergenceWeeklyDirectives(1,4,1));
  });

  it('keeps persisted stale weekly progress identifiable after reload instead of aliasing it to the new week',()=>{
    const moved=finishAndAdvance({...initialState,year:2,month:7,week:1,weeklyLife:emptyWeeklyLifeState()});
    const reloaded=hydrateGameState({
      ...moved,
      weeklyDirectiveKey:'2-7-1',
      weeklyDirectiveProgress:{training_once:99},
      astralRiftWeeklyKey:'2-7-1',
      astralRiftWeeklyProgress:{rift_clear:2,high_grade:1,featured_rift:1},
      convergenceWeeklyKey:'2-7-1',
      convergenceWeeklyProgress:{convergence_clear:2,high_grade:1,featured_guardian:1},
    });
    expect(keys(reloaded)).toEqual({directive:'2-7-2',rift:'2-7-2',convergence:'2-7-2'});
    expect(reloaded.astralRiftWeeklyKey).toBe('2-7-1');
    expect(reloaded.convergenceWeeklyKey).toBe('2-7-1');
    expect(reloaded.astralRiftWeeklyKey).not.toBe(keys(reloaded).rift);
    expect(reloaded.convergenceWeeklyKey).not.toBe(keys(reloaded).convergence);
  });

  it('rotates all weekly keys once across the month boundary',()=>{
    const week4={...initialState,year:1,month:11,week:4,weeklyLife:emptyWeeklyLifeState()};
    const next=finishAndAdvance(week4);
    expect(next).toMatchObject({year:1,month:12,week:1});
    expect(keys(next)).toEqual({directive:'1-12-1',rift:'1-12-1',convergence:'1-12-1'});
  });

  it('rotates all weekly keys across December into the next year',()=>{
    const week4={...initialState,year:3,month:12,week:4,weeklyLife:emptyWeeklyLifeState()};
    const next=finishAndAdvance(week4);
    expect(next).toMatchObject({year:4,month:1,week:1});
    expect(keys(next)).toEqual({directive:'4-1-1',rift:'4-1-1',convergence:'4-1-1'});
  });
});
