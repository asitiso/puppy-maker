import {useEffect,useState} from 'react';
import type {GameState} from './game';
import MobileExplorationScene from './exploration/MobileExplorationScene';
import {districtLabel,nextDistrictToward,parseDistrictDestination,rpgDistrictWorld} from './exploration/rpg-district-worlds';
import {mobileCategoryRecommendation,type MobileWorldRecommendation} from './mobile-category-guidance';
import type {MobileContentCategory,MobileFeatureId} from './mobile-router';
import {
  clearWorldQuest,isQuestResolved,loadContinuousWorldQuest,loadWorldQuest,loadWorldQuestHistory,
  markWorldQuestReady,npcQuestProgress,questFromRecommendation,recordWorldQuestCompletion,
  saveContinuousWorldQuest,saveWorldQuest,type WorldQuestContract,type WorldQuestHistory,
} from './world-quest-contract';
import {questNpcForCategory} from './world-quest-npcs';
import WorldQuestNpcDialog from './WorldQuestNpcDialog';
import './rpg-home-hub.css';

const runaExplorationArt='/assets/exploration/forest/runa-topdown.svg';
const noStoryFrames={};
const noop=()=>{};

type Props={category:MobileContentCategory;state:GameState;onFeature:(feature:MobileFeatureId)=>void;onBack:()=>void;};

function recommendationFor(category:MobileContentCategory,state:GameState):MobileWorldRecommendation{
  return {...mobileCategoryRecommendation(category,state),category,priority:'routine'};
}

export default function RpgDistrictHub({category,state,onFeature,onBack}:Props){
  const storage=typeof window==='undefined'?null:window.localStorage;
  const [activeCategory,setActiveCategory]=useState(category);
  const [acceptedQuest,setAcceptedQuest]=useState<WorldQuestContract|null>(()=>loadWorldQuest(storage));
  const [continuous,setContinuous]=useState(()=>loadContinuousWorldQuest(storage));
  const [completionNotice,setCompletionNotice]=useState<string|null>(null);
  const [history,setHistory]=useState<WorldQuestHistory>(()=>loadWorldQuestHistory(storage));
  const [npcDialogOpen,setNpcDialogOpen]=useState(false);

  useEffect(()=>{setActiveCategory(category);setNpcDialogOpen(false);},[category]);

  const localRecommendation=recommendationFor(activeCategory,state);
  const questRecommendation=acceptedQuest?recommendationFor(acceptedQuest.category,state):null;
  const baseWorld=rpgDistrictWorld(activeCategory);
  const currentNpc=questNpcForCategory(activeCategory);
  const issuer=acceptedQuest?questNpcForCategory(acceptedQuest.category):currentNpc;
  const acceptedLocal=acceptedQuest?.category===activeCategory;
  const questReady=Boolean(acceptedQuest?.readyToTurnIn);

  useEffect(()=>{
    if(!acceptedQuest||acceptedQuest.readyToTurnIn||!questRecommendation)return;
    if(!isQuestResolved(acceptedQuest,questRecommendation))return;
    const ready=markWorldQuestReady(storage,acceptedQuest);
    setAcceptedQuest(ready);
    const npc=questNpcForCategory(acceptedQuest.category);
    setCompletionNotice(`${npc.name}: 목표 달성 확인. 돌아와서 완료를 보고해 줘.`);
  },[acceptedQuest,questRecommendation?.category,questRecommendation?.feature,storage]);

  const issuerCompleted=history.completedByIssuer[issuer.id]??0;
  const questProgress=npcQuestProgress(issuerCompleted);
  const targetCategory=acceptedQuest?.category??activeCategory;
  const targetLabel=acceptedQuest
    ?questReady?`${issuer.name}에게 완료 보고`:acceptedQuest.title
    :`${currentNpc.name}에게 새 의뢰 확인`;
  const targetReason=acceptedQuest?.reason??currentNpc.greeting;
  const nextDistrict=nextDistrictToward(activeCategory,targetCategory);
  const routeHint=nextDistrict
    ?`${districtLabel(nextDistrict)} 게이트로 이동`
    :acceptedQuest
      ?questReady?`${issuer.name}에게 돌아가 완료 보고`:`${acceptedQuest.title} 시설로 이동`
      :`${currentNpc.name}에게 직접 말을 걸어 의뢰 확인`;
  const priorityLabel=acceptedQuest?questReady?'완료 보고 가능':'수행 중 의뢰':'NPC 의뢰';

  const npcInteractionId=`district-quest-npc:${activeCategory}`;
  const npcLabel=acceptedLocal
    ?questReady?`${currentNpc.name} · 완료 보고`:`${currentNpc.name} · 의뢰 수행 중`
    :acceptedQuest
      ?`${currentNpc.name} · 대화`
      :`${currentNpc.name} · 새 의뢰`;
  const npcBadge=acceptedLocal?(questReady?'?':'·'):acceptedQuest?undefined:'!';
  const npcBadgeTone:'quest'|'active'|'ready'|undefined=acceptedLocal?(questReady?'ready':'active'):acceptedQuest?undefined:'quest';
  const world={
    ...baseWorld,
    objective:`${baseWorld.objective} ${priorityLabel}: ${targetLabel}. 다음 길: ${routeHint}.`,
    interactables:baseWorld.interactables.map(item=>item.id===npcInteractionId?{...item,label:npcLabel,badge:npcBadge,badgeTone:npcBadgeTone}:item),
  };

  const enterFeature=(feature:MobileFeatureId)=>{
    if(acceptedQuest&&!acceptedQuest.readyToTurnIn&&acceptedQuest.category===activeCategory&&acceptedQuest.feature===feature){
      const ready=markWorldQuestReady(storage,acceptedQuest);
      setAcceptedQuest(ready);
      setCompletionNotice(`${currentNpc.name}: 목표 시설 확인 완료. 돌아와서 결과를 보고해 주세요.`);
    }
    onFeature(feature);
  };

  const acceptQuest=()=>{
    if(acceptedQuest)return;
    const quest=questFromRecommendation(localRecommendation);
    saveWorldQuest(storage,quest);
    setAcceptedQuest(quest);
    setCompletionNotice(`${currentNpc.name}: ${quest.title} 의뢰를 맡겼어요.`);
    setNpcDialogOpen(false);
  };
  const abandonQuest=()=>{
    if(!acceptedLocal)return;
    clearWorldQuest(storage);
    setAcceptedQuest(null);
    if(continuous){
      saveContinuousWorldQuest(storage,false);
      setContinuous(false);
      setCompletionNotice(`${currentNpc.name}: 의뢰를 포기해 연속 의뢰도 함께 멈췄어요.`);
    }else setCompletionNotice(`${currentNpc.name}: 의뢰를 취소했어요. 다시 필요하면 말을 걸어 주세요.`);
    setNpcDialogOpen(false);
  };
  const turnInQuest=()=>{
    if(!acceptedQuest||!acceptedQuest.readyToTurnIn||acceptedQuest.category!==activeCategory)return;
    const completed=acceptedQuest;
    const nextHistory=recordWorldQuestCompletion(storage,completed);
    clearWorldQuest(storage);
    setHistory(nextHistory);
    const npc=questNpcForCategory(completed.category);
    if(continuous){
      const nextRecommendation=recommendationFor(activeCategory,state);
      const nextQuest=questFromRecommendation(nextRecommendation);
      if(nextQuest.id!==completed.id){
        saveWorldQuest(storage,nextQuest);
        setAcceptedQuest(nextQuest);
        setCompletionNotice(`${npc.completion} 다음 의뢰도 이어서 맡겼어요.`);
      }else{
        setAcceptedQuest(null);
        setCompletionNotice(`${npc.completion} 새 의뢰가 생기면 다시 알려줄게요.`);
      }
    }else{
      setAcceptedQuest(null);
      setCompletionNotice(`${npc.name}: ${npc.completion}`);
    }
    setNpcDialogOpen(false);
  };
  const toggleContinuous=()=>{
    const next=!continuous;
    saveContinuousWorldQuest(storage,next);
    setContinuous(next);
    setCompletionNotice(next?'연속 의뢰가 켜졌어요. 완료 보고 후 다음 의뢰를 자동 수락합니다.':'연속 의뢰가 꺼졌어요.');
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
        if(destination?.kind==='feature')enterFeature(destination.feature);
        else if(destination?.kind==='district'){setNpcDialogOpen(false);setActiveCategory(destination.category);}
        else if(destination?.kind==='questNpc')setNpcDialogOpen(true);
      }}
    />
    <aside className="rpg-home-hub__tracker rpg-district-hub__tracker" aria-label="월드 의뢰 추적">
      <div className="rpg-district-hub__npc"><b>{issuer.name}</b><span>{issuer.role}</span><i>{questProgress.rank} · {issuerCompleted}건</i></div>
      {questProgress.nextRank&&<div className="rpg-district-hub__chain" aria-label="NPC 의뢰 관계 진행"><span>다음 관계 · {questProgress.nextRank}까지 {questProgress.remaining}건</span><progress value={questProgress.percent} max="100">{questProgress.percent}%</progress></div>}
      <small>WORLD QUEST · {priorityLabel} · 전체 {history.completed}건{continuous?' · 연속 의뢰 ON':''}</small>
      <strong>{targetLabel}</strong>
      <p>{targetReason}</p>
      <span>다음 길 · {routeHint} · {state.year}년차 {state.month}월 {state.week}주차</span>
      <span className="rpg-district-hub__walk-note">의뢰 수락·완료는 NPC에게 직접 다가가 대화하세요.</span>
      {completionNotice&&<em role="status">✓ {completionNotice}</em>}
    </aside>
    {npcDialogOpen&&<WorldQuestNpcDialog
      npc={currentNpc}
      recommendation={localRecommendation}
      activeQuest={acceptedQuest}
      history={history}
      continuous={continuous}
      onClose={()=>setNpcDialogOpen(false)}
      onAccept={acceptQuest}
      onAbandon={abandonQuest}
      onTurnIn={turnInQuest}
      onToggleContinuous={toggleContinuous}
    />}
  </section>;
}
