import {useEffect,useState} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {districtLabel,nextDistrictToward,parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileWorldRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};

type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onBack:()=>void;};

export default function RpgDistrictHub({category,state,onFeature,onBack}:Props){
  const [activeCategory,setActiveCategory]=useState(category);
  useEffect(()=>setActiveCategory(category),[category]);
  const baseWorld=rpgDistrictWorld(activeCategory);
  const recommendation=mobileWorldRecommendation(activeCategory,state);
  const nextDistrict=nextDistrictToward(activeCategory,recommendation.category);
  const routeHint=nextDistrict
    ?`${districtLabel(nextDistrict)} 게이트로 이동`
    :`${districtLabel(activeCategory)} 안의 ${recommendation.label} 시설로 이동`;
  const priorityLabel=recommendation.priority==='reward'?'받을 보상':recommendation.priority==='progress'?'진행 중 목표':'추천 행동';
  const world={...baseWorld,objective:`${baseWorld.objective} ${priorityLabel}: ${recommendation.label}. 다음 길: ${routeHint}.`};

  return <section className="rpg-home-hub rpg-district-hub" aria-label={`${world.label} 월드 구역`}>
    <MobileExplorationScene
      key={activeCategory}
      world={world}
      storyFrames={noStoryFrames}
      playerArtSrc={runaExplorationArt}
      onProgress={noop}
      onExit={onBack}
      onPortal={destinationId=>{
        const destination=parseDistrictDestination(destinationId);
        if(destination?.kind==='feature')onFeature(destination.feature);
        else if(destination?.kind==='district')setActiveCategory(destination.category);
      }}
    />
    <aside className="rpg-home-hub__tracker rpg-district-hub__tracker" aria-label="월드 의뢰 추적">
      <small>WORLD GUIDE · {priorityLabel}</small>
      <strong>{recommendation.label}</strong>
      <p>{recommendation.reason}</p>
      <span>다음 길 · {routeHint} · {state.year}년차 {state.month}월 {state.week}주차</span>
    </aside>
  </section>;
}
