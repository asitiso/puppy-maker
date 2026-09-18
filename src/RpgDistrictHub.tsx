import {useEffect,useState} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {districtLabel,nextDistrictToward,parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileWorldRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import {clearWorldQuest,isQuestResolved,loadWorldQuest,questFromRecommendation,saveWorldQuest,type WorldQuestContract} from './world-quest-contract';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};

type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onBack:()=>void;};

export default function RpgDistrictHub({category,state,onFeature,onBack}:Props){
  const [activeCategory,setActiveCategory]=useState(category);
  const [acceptedQuest,setAcceptedQuest]=useState<WorldQuestContract|null>(()=>typeof window==='undefined'?null:loadWorldQuest(window.localStorage));
  const [completionNotice,setCompletionNotice]=useState<string|null>(null);
  useEffect(()=>setActiveCategory(category),[category]);
  const baseWorld=rpgDistrictWorld(activeCategory);
  const recommendation=mobileWorldRecommendation(activeCategory,state);
  const resolved=acceptedQuest?isQuestResolved(acceptedQuest,recommendation):false;
  const trackedQuest=acceptedQuest&&!resolved?acceptedQuest:null;
  const targetCategory=trackedQuest?.category??recommendation.category;
  const targetLabel=trackedQuest?.title??recommendation.label;
  const targetReason=trackedQuest?.reason??recommendation.reason;
  const nextDistrict=nextDistrictToward(activeCategory,targetCategory);
  const routeHint=nextDistrict
    ?`${districtLabel(nextDistrict)} 게이트로 이동`
    :`${districtLabel(activeCategory)} 안의 ${targetLabel} 시설로 이동`;
  const priorityLabel=trackedQuest?'수행 중 의뢰':recommendation.priority==='reward'?'받을 보상':recommendation.priority==='progress'?'진행 중 목표':'추천 행동';
  const world={...baseWorld,objective:`${baseWorld.objective} ${priorityLabel}: ${targetLabel}. 다음 길: ${routeHint}.`};

  useEffect(()=>{
    if(!acceptedQuest||!resolved)return;
    clearWorldQuest(typeof window==='undefined'?null:window.localStorage);
    setCompletionNotice(`${acceptedQuest.title} 완료`);
    setAcceptedQuest(null);
  },[acceptedQuest,resolved]);

  const acceptQuest=()=>{
    const quest=questFromRecommendation(recommendation);
    saveWorldQuest(typeof window==='undefined'?null:window.localStorage,quest);
    setAcceptedQuest(quest);
    setCompletionNotice(null);
  };

  const abandonQuest=()=>{
    clearWorldQuest(typeof window==='undefined'?null:window.localStorage);
    setAcceptedQuest(null);
  };

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
      <small>WORLD QUEST · {priorityLabel}</small>
      <strong>{trackedQuest?'수행 중':'추천 의뢰'} · {targetLabel}</strong>
      <p>{targetReason}</p>
      <span>다음 길 · {routeHint} · {state.year}년차 {state.month}월 {state.week}주차</span>
      {completionNotice&&<em role="status">✓ {completionNotice} · 다음 의뢰가 갱신되었습니다.</em>}
      <div className="rpg-district-hub__quest-actions">
        {trackedQuest
          ?<button type="button" onClick={abandonQuest}>의뢰 포기</button>
          :<button type="button" onClick={acceptQuest}>이 의뢰 수락</button>}
      </div>
    </aside>
  </section>;
}
