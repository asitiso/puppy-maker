import type {GameState} from './game';
import LineageChronicle from './LineageChronicle';
import WorldChronicle from './WorldChronicle';
import './lineage-chronicle.css';
import './mobile-v10-guidance.css';
import {livingNpcLabels,weeklyNpcPresence} from './living-npcs';
import {weekKey} from './weekly-calendar';
import {weeklyFocusRecommendations} from './weekly-focus-guidance';
import {weeklyEventFor,type WeeklyEventId,type WeeklyFocusId,weeklyFocusIds} from './weekly-life';

const focusLabels:Record<WeeklyFocusId,string>={
  training:'훈련',rest:'휴식',outing:'외출',bond:'관계',world:'세계',tactical:'전투',season:'시즌',
};
const eventLabels:Record<WeeklyEventId,string>={
  training_partner:'함께하는 훈련',quiet_rain:'조용한 비',market_day:'시장 열리는 날',campfire_invitation:'모닥불의 초대',
  guardian_patrol:'수호대 순찰',rival_challenge:'라이벌의 도전',festival_preparation:'축제 준비',old_echo:'오래된 메아리',rift_whisper:'균열의 속삭임',
  independent_patrol:'독립 순찰',veteran_patrol:'숙련 수호자 순찰',ancestral_story:'가문의 이야기',
  academy_drill:'수호자 학교 훈련',legacy_road_patrol:'이어진 옛길 순찰',rift_watch_rounds:'균열 감시 순회',scarred_district:'상흔이 남은 거리',
};

type Props={
  state:GameState;
  onSelectFocus:(focus:WeeklyFocusId)=>void;
  onComplete:()=>void;
  onAdvance:()=>void;
  showChronicles?:boolean;
};

export default function WeeklyPlannerCard({state,onSelectFocus,onComplete,onAdvance,showChronicles=true}:Props){
  const current=weekKey(state.year,state.month,state.week);
  const selected=state.weeklyLife.focusKey===current?state.weeklyLife.focus:null;
  const completed=state.weeklyLife.completedWeekKey===current;
  const recommendations=weeklyFocusRecommendations(state);
  const npcs=weeklyNpcPresence({
    activeCampaign:state.campaignRun.activeCampaign,
    activeRoute:state.campaignRun.activeRoute,
    week:state.week,
    month:state.month,
    runNumber:state.campaignRun.runNumber,
    inheritedFactCount:state.worldHistory.inheritedFacts.length,
    generation:state.lineage.generation,
    legacyMarkers:state.generationalWorld.legacyMarkers,
    completedProjects:state.generationalWorld.completedProjects,
  });
  const event=selected?weeklyEventFor({
    year:state.year,month:state.month,week:state.week,focus:selected,
    activeCampaign:state.campaignRun.activeCampaign,activeRoute:state.campaignRun.activeRoute,
    runNumber:state.campaignRun.runNumber,inheritedFactCount:state.worldHistory.inheritedFacts.length,
    heritageTraits:state.lineage.heritageTraits,
    generation:state.lineage.generation,
    legacyMarkers:state.generationalWorld.legacyMarkers,
    completedProjects:state.generationalWorld.completedProjects,
  }):null;

  return <>
    <section className="weekly-planner-card" aria-label="이번 주 계획">
      <header><small>LIVING YEAR</small><strong>{state.year}년차 {state.month}월 {state.week}주차</strong><span>{completed?'이번 주 완료':selected?`선택됨 · ${focusLabels[selected]}`:'이번 주의 중심을 골라보세요'}</span></header>
      <div className="weekly-presence"><small>이번 주 만남</small><b>{npcs.map(id=>livingNpcLabels[id]).join(' · ')}</b></div>
      {recommendations.length>0&&<div className="v10-weekly-recommendations" aria-label="이번 주 추천 선택">
        <small>지금 살펴볼 선택</small>
        <div className="v10-weekly-recommendation-list">
          {recommendations.map(item=><button key={item.focus} type="button" className="v10-weekly-recommendation" data-recommended-focus={item.focus} disabled={completed} onClick={()=>onSelectFocus(item.focus)}><b>{item.label}</b><span>{item.reason}</span></button>)}
        </div>
      </div>}
      <div className="weekly-focus-grid">
        {weeklyFocusIds.map(focus=><button key={focus} type="button" data-weekly-focus={focus} aria-pressed={selected===focus} disabled={completed} onClick={()=>onSelectFocus(focus)}>{focusLabels[focus]}</button>)}
      </div>
      <div className="weekly-event-teaser"><small>이번 주 이야기</small><b>{event?eventLabels[event]:'중심을 고르면 이번 주의 만남이 정해져요.'}</b></div>
      {completed
        ? <button type="button" className="weekly-planner-advance" onClick={onAdvance}>다음 주 시작</button>
        : selected&&<button type="button" className="weekly-planner-resolve" onClick={onComplete}>이번 주 마무리</button>}
    </section>
    {showChronicles&&<><LineageChronicle state={state}/><WorldChronicle generation={state.lineage.generation} world={state.generationalWorld}/></>}
  </>;
}
