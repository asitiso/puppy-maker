import {useEffect,useState} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {districtLabel,nextDistrictToward,parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileWorldRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import {clearWorldQuest,isQuestResolved,loadWorldQuest,loadWorldQuestHistory,npcQuestProgress,questFromRecommendation,recordWorldQuestCompletion,saveWorldQuest,type WorldQuestContract,type WorldQuestHistory} from './world-quest-contract';
import {questNpcForCategory} from './world-quest-npcs';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';const noStoryFrames={};const noop=()=>{};
type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onBack:()=>void;};
export default function RpgDistrictHub({category,state,onFeature,onBack}:Props){
  const [activeCategory,setActiveCategory]=useState(category);
  const [acceptedQuest,setAcceptedQuest]=useState<WorldQuestContract|null>(()=>typeof window==='undefined'?null:loadWorldQuest(window.localStorage));
  const [completionNotice,setCompletionNotice]=useState<string|null>(null);
  const [history,setHistory]=useState<WorldQuestHistory>(()=>loadWorldQuestHistory(typeof window==='undefined'?null:window.localStorage));
  useEffect(()=>setActiveCategory(category),[category]);
  const baseWorld=rpgDistrictWorld(activeCategory);const recommendation=mobileWorldRecommendation(activeCategory,state);const resolved=acceptedQuest?isQuestResolved(acceptedQuest,recommendation):false;const trackedQuest=acceptedQuest&&!resolved?acceptedQuest:null;
  const targetCategory=trackedQuest?.category??recommendation.category;const targetLabel=trackedQuest?.title??recommendation.label;const targetReason=trackedQuest?.reason??recommendation.reason;const issuer=trackedQuest?questNpcForCategory(trackedQuest.category):questNpcForCategory(recommendation.category);const issuerCompleted=history.completedByIssuer[issuer.id]??0;const questProgress=npcQuestProgress(issuerCompleted);const issuerJournal=history.recent.filter(entry=>entry.issuerId===issuer.id).slice(0,3);
  const nextDistrict=nextDistrictToward(activeCategory,targetCategory);const routeHint=nextDistrict?`${districtLabel(nextDistrict)} 게이트로 이동`:`${districtLabel(activeCategory)} 안의 ${targetLabel} 시설로 이동`;const priorityLabel=trackedQuest?'수행 중 의뢰':recommendation.priority==='reward'?'받을 보상':recommendation.priority==='progress'?'진행 중 목표':'추천 행동';const world={...baseWorld,objective:`${baseWorld.objective} ${issuer.name}의 ${priorityLabel}: ${targetLabel}. 다음 길: ${routeHint}.`};
  useEffect(()=>{if(!acceptedQuest||!resolved)return;const storage=typeof window==='undefined'?null:window.localStorage;clearWorldQuest(storage);const next=recordWorldQuestCompletion(storage,acceptedQuest);const npc=questNpcForCategory(acceptedQuest.category);setCompletionNotice(`${npc.name}: ${npc.completion}`);setHistory(next);setAcceptedQuest(null);},[acceptedQuest,resolved]);
  const acceptQuest=()=>{const quest=questFromRecommendation(recommendation);saveWorldQuest(typeof window==='undefined'?null:window.localStorage,quest);setAcceptedQuest(quest);setCompletionNotice(null);};
  const abandonQuest=()=>{clearWorldQuest(typeof window==='undefined'?null:window.localStorage);setAcceptedQuest(null);};
  return <section className="rpg-home-hub rpg-district-hub" aria-label={`${world.label} 월드 구역`}>
    <MobileExplorationScene key={activeCategory} world={world} storyFrames={noStoryFrames} playerArtSrc={runaExplorationArt} onProgress={noop} onExit={onBack} onPortal={destinationId=>{const destination=parseDistrictDestination(destinationId);if(destination?.kind==='feature')onFeature(destination.feature);else if(destination?.kind==='district')setActiveCategory(destination.category);}}/>
    <aside className="rpg-home-hub__tracker rpg-district-hub__tracker" aria-label="월드 의뢰 추적">
      <div className="rpg-district-hub__npc"><b>{issuer.name}</b><span>{issuer.role}</span><i>{questProgress.rank} · {issuerCompleted}건</i></div>
      {questProgress.nextRank&&<div className="rpg-district-hub__chain" aria-label="NPC 의뢰 관계 진행"><span>다음 관계 · {questProgress.nextRank}까지 {questProgress.remaining}건</span><progress value={questProgress.percent} max="100">{questProgress.percent}%</progress></div>}
      <small>WORLD QUEST · {priorityLabel} · 전체 {history.completed}건</small><strong>{trackedQuest?'수행 중':'추천 의뢰'} · {targetLabel}</strong><p>{trackedQuest?targetReason:issuer.greeting}</p>{!trackedQuest&&<span>{targetReason}</span>}<span>다음 길 · {routeHint} · {state.year}년차 {state.month}월 {state.week}주차</span>{completionNotice&&<em role="status">✓ {completionNotice}</em>}
      <div className="rpg-district-hub__quest-actions">{trackedQuest?<><button type="button" onClick={()=>onFeature(trackedQuest.feature)}>목적지 열기</button><button type="button" onClick={abandonQuest}>포기</button></>:<button type="button" onClick={acceptQuest}>{issuer.name}의 의뢰 수락</button>}</div>
      {issuerJournal.length>0&&<details className="rpg-district-hub__journal"><summary>{issuer.name}와 최근 완료 {issuerJournal.length}건</summary>{issuerJournal.map((entry,index)=><span key={`${entry.completedAt}:${index}`}>✓ {entry.title}</span>)}</details>}
    </aside>
  </section>;
}
