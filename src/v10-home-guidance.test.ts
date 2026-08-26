import {describe,expect,it} from 'vitest';
import {attendanceKey} from './attendance';
import {currentAvailableMail,eligibleAchievements,initialState} from './game';
import {hubGuidedActionStack,hubNextAction} from './hub-next-action';
import {emptyWeeklyLifeState,selectWeeklyFocus} from './weekly-life';
import {weekKey} from './weekly-calendar';

function settledState(){
  const available=currentAvailableMail(initialState);
  const achievements=eligibleAchievements(initialState);
  return {
    ...initialState,
    claimedMailRewards:[...new Set([...initialState.claimedMailRewards,...available])],
    claimedAttendanceMonths:[...new Set([...initialState.claimedAttendanceMonths,attendanceKey(initialState.year,initialState.month)])],
    claimedAchievements:[...new Set([...initialState.claimedAchievements,...achievements])],
    weeklyLife:emptyWeeklyLifeState(),
  };
}

describe('V10 Home authoritative guidance stack',()=>{
  it('keeps one primary action and at most two useful secondary routes',()=>{
    const state={...settledState(),claimedMailRewards:[],claimedAttendanceMonths:[]};
    const stack=hubGuidedActionStack(state);

    expect(stack.primary).toMatchObject({domain:'reward',route:'mail',state:'ready'});
    expect(stack.secondary[0]).toMatchObject({domain:'reward',route:'attendance',state:'ready'});
    expect(stack.secondary.length).toBeLessThanOrEqual(2);
    expect(new Set([stack.primary.route,...stack.secondary.map(item=>item.route)]).size).toBe(1+stack.secondary.length);
  });

  it('keeps a selected weekly focus as primary after claimable rewards are settled',()=>{
    const current=weekKey(initialState.year,initialState.month,initialState.week);
    const state={...settledState(),weeklyLife:selectWeeklyFocus(emptyWeeklyLifeState(),current,'world')};
    const stack=hubGuidedActionStack(state);

    expect(stack.primary).toMatchObject({domain:'world',route:'expedition'});
    expect(stack.secondary.some(item=>item.route==='schedule')).toBe(true);
  });

  it('preserves hubNextAction as the primary compatibility view',()=>{
    const state=settledState();
    const primary=hubGuidedActionStack(state).primary;
    expect(hubNextAction(state)).toEqual({
      domain:primary.domain,
      label:primary.label,
      detail:primary.detail,
      route:primary.route,
      priority:primary.priority,
    });
  });
});
