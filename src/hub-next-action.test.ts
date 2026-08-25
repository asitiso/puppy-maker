import {describe,expect,it} from 'vitest';
import {attendanceKey} from './attendance';
import {currentAvailableMail,eligibleAchievements,initialState} from './game';
import {hubNextAction} from './hub-next-action';
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

describe('V4 authoritative Hub next action',()=>{
  it('prioritizes claimable rewards before weekly planning',()=>{
    const state={...settledState(),claimedMailRewards:[]};
    expect(hubNextAction(state).route).toBe('mail');
  });

  it('asks for a weekly focus when rewards are settled',()=>{
    const state=settledState();
    expect(hubNextAction(state)).toMatchObject({domain:'weekly',route:'weekly_planner'});
  });

  it('guides the selected focus and advances only after resolution',()=>{
    const current=weekKey(initialState.year,initialState.month,initialState.week);
    const focused={...settledState(),weeklyLife:selectWeeklyFocus(emptyWeeklyLifeState(),current,'world')};
    expect(hubNextAction(focused)).toMatchObject({domain:'world',route:'expedition'});
    const completed={...focused,weeklyLife:{...focused.weeklyLife,completedWeekKey:current}};
    expect(hubNextAction(completed)).toMatchObject({domain:'weekly',route:'advance_week'});
  });

  it('falls back to schedule when weekly state is unavailable for a legacy caller',()=>{
    const legacy={...settledState()} as Record<string,unknown>;
    delete legacy.weeklyLife;
    expect(hubNextAction(legacy as never).route).toBe('schedule');
  });
});
