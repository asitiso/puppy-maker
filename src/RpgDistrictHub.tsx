import {useEffect,useMemo,useState} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileCategoryRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};
type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onBack:()=>void;};

export default function RpgDistrictHub({category,state,onFeature,onBack}:Props){
  const [activeCategory,setActiveCategory]=useState(category);
  useEffect(()=>setActiveCategory(category),[category]);
  const recommendation=mobileCategoryRecommendation(activeCategory,state);
  const world=useMemo(()=>{
    const base=rpgDistrictWorld(activeCategory);
    return {
      ...base,
      objective:`${base.objective} 현재 추적: ${recommendation.label}`,
      interactables:base.interactables.map(interaction=>{
        const destination=parseDistrictDestination(interaction.destinationId??'');
        return destination?.kind==='feature'&&destination.feature===recommendation.feature
          ?{...interaction,label:`◆ ${recommendation.label}`,questTarget:true,nameplate:`추천 의뢰 · ${recommendation.label}`}
          :interaction;
      }),
    };
  },[activeCategory,recommendation.feature,recommendation.label]);

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
    <aside className="rpg-home-hub__tracker rpg-district-hub__tracker" aria-label="구역 의뢰 추적">
      <small>DISTRICT · {world.label}</small>
      <strong>추천 의뢰 · {recommendation.label}</strong>
      <p>{recommendation.reason}</p>
      <span>{state.year}년차 · {state.month}월 {state.week}주차 · 월드의 ◆ 표식을 따라가세요</span>
    </aside>
  </section>;
}
