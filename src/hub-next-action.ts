import {attendanceKey} from './attendance';
import {currentAvailableMail,eligibleAchievements,type GameState} from './game';
import {guidedActionStack,type GuidedAction,type GuidedActionDomain,type GuidedActionRoute,type GuidedActionStack} from './guided-actions';
import {weekKey} from './weekly-calendar';
import type {WeeklyFocusId,WeeklyLifeState} from './weekly-life';

export type HubNextActionDomain=Exclude<GuidedActionDomain,'records'>;
export type HubNextActionRoute=GuidedActionRoute;
export type HubNextAction={
  domain:HubNextActionDomain;
  label:string;
  detail:string;
  route:HubNextActionRoute;
  priority:number;
};

type WeeklyAwareGameState=GameState&{weeklyLife?:WeeklyLifeState};

type HubGuidedAction=GuidedAction&{domain:HubNextActionDomain};

const focusAction:Record<WeeklyFocusId,Omit<HubGuidedAction,'id'|'state'>>={
  training:{domain:'raising',label:'이번 주 훈련',detail:'이번 주 계획에 맞춰 훈련을 진행하세요.',route:'schedule',priority:60},
  rest:{domain:'raising',label:'이번 주 휴식',detail:'회복을 우선하고 루나의 상태를 돌보세요.',route:'schedule',priority:60},
  outing:{domain:'raising',label:'이번 주 외출',detail:'밖으로 나가 새로운 경험을 만들어 보세요.',route:'outing',priority:60},
  bond:{domain:'bond',label:'이번 주 관계',detail:'이번 주에 만날 사람과의 시간을 확인하세요.',route:'bond',priority:60},
  world:{domain:'world',label:'이번 주 세계',detail:'지역의 변화와 원정을 확인하세요.',route:'expedition',priority:60},
  tactical:{domain:'tactical',label:'이번 주 전투',detail:'전술 임무와 전투 준비를 확인하세요.',route:'tactical',priority:60},
  season:{domain:'season',label:'이번 주 시즌',detail:'기간성 목표와 이번 주 진행을 확인하세요.',route:'season',priority:60},
};

const ready=(id:string,action:Omit<HubGuidedAction,'id'|'state'>):HubGuidedAction=>({id,...action,state:'ready'});

export function hubGuidedActionStack(state:WeeklyAwareGameState):GuidedActionStack{
  const candidates:HubGuidedAction[]=[];
  const availableMail=currentAvailableMail(state).find(id=>!state.claimedMailRewards.includes(id));
  if(availableMail)candidates.push(ready(`mail:${availableMail}`,{domain:'reward',label:'받을 편지가 있어요',detail:'도착한 보상을 먼저 확인하세요.',route:'mail',priority:100}));

  const attendance=attendanceKey(state.year,state.month);
  if(!state.claimedAttendanceMonths.includes(attendance))candidates.push(ready(`attendance:${attendance}`,{domain:'reward',label:'출석 보상 받기',detail:'이번 달 출석 보상을 받을 수 있어요.',route:'attendance',priority:95}));

  const achievement=eligibleAchievements(state).find(id=>!state.claimedAchievements.includes(id));
  if(achievement)candidates.push(ready(`achievement:${achievement}`,{domain:'reward',label:'달성 보상 받기',detail:'새로 달성한 기록의 보상을 확인하세요.',route:'achievement',priority:90}));

  if(state.weeklyLife){
    const current=weekKey(state.year,state.month,state.week);
    if(state.weeklyLife.completedWeekKey===current){
      candidates.push(ready(`advance:${current}`,{domain:'weekly',label:'다음 주로',detail:'이번 주의 선택이 기록됐어요. 다음 주를 시작하세요.',route:'advance_week',priority:80}));
    }else if(state.weeklyLife.focusKey!==current||!state.weeklyLife.focus){
      candidates.push(ready(`planner:${current}`,{domain:'weekly',label:'이번 주를 정해요',detail:'이번 주에 가장 중요하게 보낼 시간을 선택하세요.',route:'weekly_planner',priority:70}));
    }else{
      candidates.push(ready(`focus:${current}:${state.weeklyLife.focus}`,focusAction[state.weeklyLife.focus]));
    }
  }

  candidates.push(ready('schedule:fallback',{domain:'schedule',label:'이번 달 계획 세우기',detail:'루나의 성장 일정을 정해 보세요.',route:'schedule',priority:10}));
  return guidedActionStack(candidates);
}

export function hubNextAction(state:WeeklyAwareGameState):HubNextAction{
  const primary=hubGuidedActionStack(state).primary as HubGuidedAction;
  return {domain:primary.domain,label:primary.label,detail:primary.detail,route:primary.route,priority:primary.priority};
}
