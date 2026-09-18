import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {HOME_HUB_DESTINATIONS,rpgHomeWorld} from './exploration/rpg-home-world';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};

type Props={
  state:GameState;
  onCategory:(category:MobileContentCategory)=>void;
  onFeature:(feature:MobileFeatureId)=>void;
};

export default function RpgHomeHub({state,onCategory,onFeature}:Props){
  const destinationActions:Record<string,()=>void>={
    [HOME_HUB_DESTINATIONS.life]:()=>onCategory('life'),
    [HOME_HUB_DESTINATIONS.growth]:()=>onCategory('growth'),
    [HOME_HUB_DESTINATIONS.outing]:()=>onFeature('outing'),
    [HOME_HUB_DESTINATIONS.expedition]:()=>onFeature('expedition'),
    [HOME_HUB_DESTINATIONS.bond]:()=>onCategory('bond'),
    [HOME_HUB_DESTINATIONS.records]:()=>onCategory('records'),
  };
  const objective=state.campaignRun.activeCampaign
    ?`현재 캠페인: ${state.campaignRun.activeCampaign} · 마을을 걸어 다음 행동을 선택하세요.`
    :'마을을 걸어 오늘 할 일을 선택하세요. 월드 게이트에서는 바로 지역 탐험을 시작할 수 있어요.';
  const world={...rpgHomeWorld,objective};

  return <section className="rpg-home-hub" aria-label="별빛 마을 월드 허브">
    <MobileExplorationScene
      world={world}
      storyFrames={noStoryFrames}
      playerArtSrc={runaExplorationArt}
      onProgress={noop}
      onExit={noop}
      onPortal={destinationId=>destinationActions[destinationId]?.()}
      showExitButton={false}
    />
    <aside className="rpg-home-hub__tracker" aria-label="현재 모험 상태">
      <small>WORLD STATUS</small>
      <strong>{state.year}년차 · {state.month}월 {state.week}주차</strong>
      <span>체력 {Math.max(0,100-state.stats.fatigue)} · 마력 {state.stats.magic} · 호감 {state.stats.affection}</span>
    </aside>
  </section>;
}
