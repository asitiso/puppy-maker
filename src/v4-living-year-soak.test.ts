import {describe,expect,it} from 'vitest';
import {hydrateGameState,initialState,reducer,type GameState} from './game';
import {hydrateSave,serializeGameState} from './game/save';
import {astralRiftWeeklyKey} from './astral-rift-weekly';
import {convergenceWeeklyKey} from './convergence-weekly';
import {weeklyDirectiveKey} from './weekly-directives';
import {emptyWeeklyLifeState,type WeeklyFocusId} from './weekly-life';
import {advanceWeekDate,weekKey} from './weekly-calendar';

const focuses:WeeklyFocusId[]=['training','rest','outing','bond','world','tactical','season'];

function expectFiniteTree(value:unknown,path='state'){
  if(typeof value==='number'){
    expect(Number.isFinite(value),`${path} must stay finite`).toBe(true);
    return;
  }
  if(Array.isArray(value)){
    value.forEach((item,index)=>expectFiniteTree(item,`${path}[${index}]`));
    return;
  }
  if(value&&typeof value==='object'){
    for(const [key,item] of Object.entries(value)) expectFiniteTree(item,`${path}.${key}`);
  }
}

function expectCanonicalWeeklyConsumers(state:GameState){
  const current=weekKey(state.year,state.month,state.week);
  expect(weeklyDirectiveKey(state.year,state.month,state.week)).toBe(current);
  expect(astralRiftWeeklyKey(state.year,state.month,state.week)).toBe(current);
  expect(convergenceWeeklyKey(state.year,state.month,state.week)).toBe(current);
}

describe('V4 Living Year long-run soak',()=>{
  it('runs 48 real weeks with exactly one monthly settlement every fourth week',()=>{
    let state:GameState={...initialState,year:1,month:1,week:1,weeklyLife:emptyWeeklyLifeState()};
    const startingMonthsCompleted=state.careerRecords.monthsCompleted;
    let monthlySettlements=0;

    for(let index=0;index<48;index+=1){
      const before={year:state.year,month:state.month,week:state.week};
      const expected=advanceWeekDate(before);
      const monthsBefore=state.careerRecords.monthsCompleted;
      const focus=focuses[index%focuses.length];

      state=reducer(state,{type:'SELECT_WEEKLY_FOCUS',focus});
      expect(state.weeklyLife.focusKey).toBe(weekKey(before.year,before.month,before.week));

      const completed=reducer(state,{type:'COMPLETE_WEEKLY_FOCUS'});
      const repeated=reducer(completed,{type:'COMPLETE_WEEKLY_FOCUS'});
      expect(repeated).toBe(completed);
      state=completed;

      if(index%8===7){
        const reloaded=hydrateSave(serializeGameState(state));
        expect(reloaded.weeklyLife).toEqual(state.weeklyLife);
        expect(reloaded).toMatchObject(before);
        expect(reducer(reloaded,{type:'COMPLETE_WEEKLY_FOCUS'})).toBe(reloaded);
        state=reloaded;
      }

      state=reducer(state,{type:'ADVANCE_WEEK'});
      expect(state).toMatchObject({year:expected.year,month:expected.month,week:expected.week});
      expect(state.weeklyLife.focusKey).toBeNull();
      expect(state.weeklyLife.focus).toBeNull();
      expect(state.weeklyLife.completedWeekKey).toBeNull();
      expect(state.weeklyLife.lastEvent).toBeNull();
      expect(new Set(state.weeklyLife.resolvedEventKeys).size).toBe(state.weeklyLife.resolvedEventKeys.length);
      expect(state.weeklyLife.resolvedEventKeys.length).toBeLessThanOrEqual(96);

      if(before.week===4){
        monthlySettlements+=1;
        expect(state.careerRecords.monthsCompleted).toBe(monthsBefore+1);
      }else{
        expect(state.careerRecords.monthsCompleted).toBe(monthsBefore);
        expect(state.month).toBe(before.month);
        expect(state.year).toBe(before.year);
      }

      expectCanonicalWeeklyConsumers(state);
      expectFiniteTree(state);

      if(index===23){
        const stale=weekKey(before.year,before.month,before.week);
        state=hydrateGameState({
          ...state,
          weeklyLife:{
            ...state.weeklyLife,
            focusKey:stale,
            focus:'world',
            completedWeekKey:stale,
            lastEvent:'guardian_patrol',
            resolvedEventKeys:[...state.weeklyLife.resolvedEventKeys,'bad',state.weeklyLife.resolvedEventKeys[0]],
          },
        });
        expect(state.weeklyLife.focusKey).toBeNull();
        expect(state.weeklyLife.focus).toBeNull();
        expect(state.weeklyLife.completedWeekKey).toBeNull();
        expect(state.weeklyLife.lastEvent).toBeNull();
        expect(state.weeklyLife.resolvedEventKeys.every(key=>/^\d+-(?:[1-9]|1[0-2])-[1-4]:/.test(key))).toBe(true);
        expect(new Set(state.weeklyLife.resolvedEventKeys).size).toBe(state.weeklyLife.resolvedEventKeys.length);
      }
    }

    expect(monthlySettlements).toBe(12);
    expect(state.careerRecords.monthsCompleted).toBe(startingMonthsCompleted+12);
    expect(state).toMatchObject({year:2,month:1,week:1});
    expect(state.weeklyLife.resolvedEventKeys).toHaveLength(48);
    expectFiniteTree(state);
  });
});
