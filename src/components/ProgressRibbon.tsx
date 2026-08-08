import type { GameState } from '../game';
import { milestoneForMonth, seasonForMonth } from '../game/progression';
const seasons={spring:'봄',summer:'여름',autumn:'가을',winter:'겨울'} as const;
const milestones={'first-quarter':'첫 계절의 끝','half-year':'함께한 반년','final-quarter':'마지막 계절을 향해','final-month':'마지막 한 달'} as const;
export function ProgressRibbon({state}:{state:GameState}){const season=seasonForMonth(state.month),milestone=milestoneForMonth(state.month);const progress=Math.min(100,Math.round(state.monthsCompleted/12*100));return <aside className="progress-ribbon" aria-label="장기 육성 진행"><div><small>{seasons[season]} · {state.monthsCompleted}/12개월</small><b>{milestone?milestones[milestone]:'루나와 함께 성장 중'}</b></div><span><i style={{width:`${progress}%`}}/></span></aside>}
