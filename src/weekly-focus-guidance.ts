import type {GameState} from './game';
import {weekKey} from './weekly-calendar';
import type {WeeklyFocusId} from './weekly-life';

export type WeeklyFocusRecommendation={focus:WeeklyFocusId;label:string;reason:string};

const labels:Record<WeeklyFocusId,string>={
  training:'훈련',rest:'휴식',outing:'외출',bond:'관계',world:'세계',tactical:'전투',season:'시즌',
};

export function weeklyFocusRecommendations(state:GameState):WeeklyFocusRecommendation[]{
  const current=weekKey(state.year,state.month,state.week);
  if(state.weeklyLife.completedWeekKey===current)return [];
  if(state.weeklyLife.focusKey===current&&state.weeklyLife.focus)return [];

  const recommendations:WeeklyFocusRecommendation[]=[];
  if(state.condition==='tired')recommendations.push({focus:'rest',label:labels.rest,reason:'루나가 피곤한 상태라 이번 주에는 회복 선택을 먼저 살펴볼 만해요.'});
  if(state.generationalWorld.activeProject)recommendations.push({focus:'world',label:labels.world,reason:'진행 중인 세계 프로젝트가 있어 이번 주에 이어서 확인할 수 있어요.'});
  return recommendations.slice(0,2);
}
