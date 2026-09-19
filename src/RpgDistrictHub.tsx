import {useEffect,useState} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {districtLabel,nextDistrictToward,parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileWorldRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import {clearWorldQuest,isQuestResolved,loadContinuousWorldQuest,loadWorldQuest,loadWorldQuestHistory,npcQuestProgress,questFromRecommendation,recordWorldQuestCompletion,saveContinuousWorldQuest,saveWorldQuest,type WorldQuestContract,type WorldQuestHistory} from './world-quest-contract';
import {questNpcForCategory} from './world-quest-npcs';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';const noStoryFrames={};const noop=()=>{};
type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onBack:()=>void;};
export default function RpgDistrictHub({category,state,onFeature,onBack}:Props){
  const storage=typeof window==='undefined'?null:window.localStorage;
  const [activeCategory,setActiveCategory]=useState(category);
  const [acceptedQuest,setAcceptedQuest]=useState<WorldQuestContract|null>(()=>loadWorldQuest(storage));
  const [continuous,setContinuous]=useState(()=>loadContinuousWorldQuest(storage));
  const [completionNotice,setCompletionNotice]=useState<string|null>(null);
  const [history,setHistory]=useState<WorldQuestHistory>(()=>loadWorldQuestHistory(storage));
  useEffect(()=>setActiveCategory(category),[category]);
  const baseWorld=rpgDistrictWorld(activeCategory);const recommendation=mobileWorldRecommendation(activeCategory,state);const resolved=acceptedQuest?isQuestResolved(acceptedQuest,recommendation):false;const trackedQuest=acceptedQuest&&!resolved?acceptedQuest:null;
  const targetCategory=trackedQuest?.category??recommendation.category;const targetLabel=trackedQuest?.title??recommendation.label;const targetReason=trackedQuest?.reason??recommendation.reason;const issuer=trackedQuest?questNpcForCategory(trackedQuest.category):questNpcForCategory(recommendation.category);const issuerCompleted=history.completedByIssuer[issuer.id]??0;const questProgress=npcQuestProgress(issuerCompleted);const issuerJournal=history.recent.filter(entry=>entry.issuerId===issuer.id).slice(0,3);
  const nextDistrict=nextDistrictToward(activeCategory,targetCategory);const routeHint=nextDistrict?`${districtLabel(nextDistrict)} 게이트로 이동`:`${districtLabel(activeCategory)} 안의 ${targetLabel} 시설로 이동`;const priorityLabel=trackedQuest?'수행 중 의뢰':recommendation.priority==='reward'?'받을 보상':recommendation.priority==='progress'?'진행 중 목표':'추천 행동';const world={...baseWorld,objective:`${baseWorld.objective} ${issuer.name}의 ${priorityLabel}: ${targetLabel}. 다음 길: ${routeHint}.`};
  useEffect(()=>{if(!acceptedQuest||!resolved)return;clearWorldQuest(storage);const next=recordWorldQuestCompletion(storage,acceptedQuest);const npc=questNpcForCategory(acceptedQuest.category);setCompletionNotice(`${npc.name}: ${npc.completion}`);setHistory(next);setAcceptedQuest(null);},[acceptedQuest,resolved]);
  useEffect(()=>{if(!continuous||acceptedQuest||resolved)return;const quest=questFromRecommendation(recommendation);saveWorldQuest(storage,quest);setAcceptedQuest(quest);setCompletionNotice('연속 의뢰 · 다음 목표로 바로 이동합니다.');onFeature(quest.feature);},[continuous,acceptedQuest,resolved,recommendation.category,recommendation.feature]);
  const acceptQuest=(open=false)=>{const quest=questFromRecommendation(recommendation);saveWorldQuest(storage,quest);setAcceptedQuest(quest);setCompletionNotice(null);if(open)onFeature(quest.feature);};
  const abandonQuest=()=>{clearWorldQuest(storage);setAcceptedQuest(null);if(continuous){saveContinuousWorldQuest(storage,false);setContinuous(false);setCompletionNotice('의뢰를 포기해 연속 의뢰도 멈췄어요.');}};
  const toggleContinuous=()=>{const next=!continuous;saveContinuousWorldQuest(storage,next);setContinuous(next);setCompletionNotice(next?'연속 의뢰가 켜졌어요. 추천 목표를 자동 수락하고 바로 이동합니다.':null);};
  return <section className="rpg-home-hub rpg-district-hub" aria-label={`${world.label} 월드 구역`}>
    <MobileExplorationScene key={activeCategory} world={world} storyFrames={noStoryFrames} playerArtSrc={runaExplorationArt} onProgress={noop} onExit={onBack} onPortal={destinationId=>{const destination=parseDistrictDestination(destinationId);if(destination?.kind==='feature')onFeature(destination.feature);else if(destination?.kind==='district')setActiveCategory(destination.category);}}/>
    <aside className="rpg-home-hub__tracker rpg-district-hub__tracker" aria-label="월드 의뢰 추적">
      <div className="rpg-district-hub__npc"><b>{issuer.name}</b><span>{issuer.role}</span><i>{questProgress.rank} · {issuerCompleted}건</i></div>
      {questProgress.nextRank&&<div className="rpg-district-hub__chain" aria-label="NPC 의뢰 관계 진행"><span>다음 관계 · {questProgress.nextRank}까지 {questProgress.remaining}건</span><progress value={questProgress.percent} max="100">{questProgress.percent}%</progress></div>}
      <small>WORLD QUEST · {priorityLabel} · 전체 {history.completed}건{continuous?' · 연속 의뢰 ON':''}</small><strong>{trackedQuest?'수행 중':'추천 의뢰'} · {targetLabel}</strong><p>{trackedQuest?targetReason:issuer.greeting}</p>{!trackedQuest&&<span>{targetReason}</span>}<span>다음 길 · {routeHint} · {state.year}년차 {state.month}월 {state.week}주차</span>{completionNotice&&<em role="status">✓ {completionNotice}</em>}
      <div className="rpg-district-hub__quest-actions">{trackedQuest?<><button type="button" onClick={()=>onFeature(trackedQuest.feature)}>목적지 열기</button><button type="button" onClick={abandonQuest}>포기</button></>:<><button type="button" onClick={()=>acceptQuest(true)}>수락하고 바로 이동</button><button type="button" onClick={()=>acceptQuest(false)}>{issuer.name}의 의뢰 수락</button></>}<button type="button" aria-pressed={continuous} onClick={toggleContinuous}>{continuous?'연속 의뢰 끄기':'연속 의뢰 켜기'}</button></div>
      {continuous&&<span>연속 의뢰는 목표 완료 후 다음 추천을 자동 수락하고 해당 시설까지 바로 엽니다. 포기하면 연속 진행도 함께 멈춥니다.</span>}
      {issuerJournal.length>0&&<details className="rpg-district-hub__journal"><summary>{issuer.name}와 최근 완료 {issuerJournal.length}건</summary>{issuerJournal.map((entry,index)=><span key={`${entry.completedAt}:${index}`}>✓ {entry.title}</span>)}</details>}
    </aside>
  </section>;
}
