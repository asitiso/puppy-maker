import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileCategoryRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};

type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onCategory:(category:MobileContentCategory)=>void;onBack:()=>void;};

export default function RpgDistrictHub({category,state,onFeature,onCategory,onBack}:Props){
  const baseWorld=rpgDistrictWorld(category);
  const recommendation=mobileCategoryRecommendation(category,state);
  const world={...baseWorld,objective:`${baseWorld.objective} 추천 행동: ${recommendation.label}`};

  return <section className="rpg-home-hub rpg-district-hub" aria-label={`${world.label} 월드 구역`}>
    <MobileExplorationScene
      world={world}
      storyFrames={noStoryFrames}
      playerArtSrc={runaExplorationArt}
      onProgress={noop}
      onExit={onBack}
      onPortal={destinationId=>{
        const destination=parseDistrictDestination(destinationId);
        if(destination?.kind==='feature')onFeature(destination.feature);
        else if(destination?.kind==='district')onCategory(destination.category);
      }}
    />
    <aside className="rpg-home-hub__tracker rpg-district-hub__tracker" aria-label="구역 의뢰 추적">
      <small>DISTRICT · {world.label}</small>
      <strong>추천 의뢰 · {recommendation.label}</strong>
      <p>{recommendation.reason}</p>
      <span>{state.year}년차 · {state.month}월 {state.week}주차 · 구역 게이트 연결됨</span>
    </aside>
  </section>;
}
