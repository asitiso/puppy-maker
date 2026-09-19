import { useCallback, useEffect, useReducer, useState } from 'react';
import type { GiftItemId, OutingLocationId } from './adventure';
import {
  activities,
  initialState,
  trainingGrade,
  type AchievementId,
  type ActivityId,
  type ExpeditionActionCounts,
  type ExpeditionCraftingRecipeId,
  type ExpeditionRelicId,
  type ExpeditionStageId,
  type GameState,
  type GrowthTraitId,
  type GuardianCallingId,
  type MailRewardId,
  type MemoryId,
  type RandomEventId,
  type Screen,
  type SkillId,
  type YearlyAmbitionId,
} from './game';
import {appReducer} from './app-living-region-reducer';
import type { AstralRiftId, AstralRiftIntensity } from './astral-rift';
import type { AstralRiftRelicId } from './astral-rift-relics';
import type { BattleResult } from './tactical-battle';
import type { CompanionId } from './tactical-companions';
import type { TacticalEncounterId } from './tactical-encounters';
import { monthlyFocusDefinitions } from './monthly-focus';
import { reportClientTelemetry } from './client-observability';
import { loadProductionState, writeProductionState } from './production-storage';
import { scheduleSynergies, scheduleSynergyDefinitions } from './schedule-synergies';
import type { SanctuaryMasterworkId } from './sanctuary-masterworks';
import type { SanctuarySpecializationId } from './sanctuary-specializations';
import type { SanctuaryFacilityId } from './starlight-sanctuary';
import type { SeasonLegacyNodeId } from './season-legacy-board';
import type { SeasonShopOfferId } from './season-shop';
import type { WeeklyFocusId } from './weekly-life';
import type {PublicProjectId} from './generational-world';
import {nextGenerationRequestEvent} from './lineage-ui-events';
import {publicProjectRequestEvent} from './public-project-ui-events';
import {livingRegionUpdateRequestEvent,type LivingRegionUpdateRequest} from './living-region-ui-events';
import {openAdventureUpdateRequestEvent} from './open-adventure-ui-events';
import type {OpenAdventureUpdate} from './adventure3d/open-adventure-state';
import {v12BuildRequestEvent,type V12BuildRequest} from './v12-build-ui-events';
import TrainingActivityMinigame from './TrainingActivityMinigame';
import './rpg-activity-loop.css';

const iconPaths: Record<string, string> = {
  sword: 'M6 19l4-4m0 0 7-7 2-4-4 2-7 7m2 2 3 3m-7-1 3 3',
  spark: 'M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z',
  moon: 'M18 16.8A8 8 0 118.2 5a6.5 6.5 0 009.8 11.8z',
  leaf: 'M5 19c7 0 12-5 14-14C10 6 5 11 5 19zm0 0c3-4 6-7 10-9',
  calendar: 'M5 5h14v14H5zM8 3v4m8-4v4M5 9h14',
  bag: 'M7 8h10l1 11H6L7 8zm3 0V6a2 2 0 014 0v2',
  quest: 'M6 4h12v16H6zM9 8h6m-6 4h6m-6 4h4',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6zm5-2v14m6-12v14',
  heart: 'M12 20S4 15 4 9a4 4 0 017-2 4 4 0 017 2c0 6-6 11-6 11z'
};

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}

const petArt: Record<'happy' | 'focus' | 'shy', string> = {
  happy: '/assets/home/runa_idle_layer.png',
  focus: '/assets/runa/runa_training_ready.png',
  shy: '/assets/runa/runa_talk.png',
};

function Pet({ mood = 'happy' }: { mood?: 'happy' | 'focus' | 'shy' }) {
  return <div className={`pet pet-${mood}`} aria-label="수호 여우 루나"><div className="pet-aura"/><img src={petArt[mood]} alt="수호 여우 루나"/></div>;
}

function Hud({ state }: { state: typeof initialState }) {
  return <header className="top-hud">
    <div className="profile-medallion"><span>Lv.10</span><b>루나</b></div>
    <div className="calendar-pill"><small>{state.year}년차</small><strong>{state.month}월 {state.week}주차</strong><em>맑음</em></div>
    <div className="currencies"><span className="currency gold">◈ {state.gold.toLocaleString()}</span><span className="currency gem">◆ {state.gems}</span></div>
  </header>;
}

function Hub({ state, go }: { state: typeof initialState; go: (s: 'schedule') => void }) {
  const [petted, setPetted] = useState(false);
  return <section className="screen hub-screen">
    <div className="cabin-backdrop"><div className="window-light"/><div className="fireplace"><i/><i/><i/></div><div className="shelf"/><div className="sparkles"/></div>
    <Hud state={state}/>
    <div className="side-stats">{([['체력', state.stats.strength], ['마력', state.stats.magic], ['호감', state.stats.affection], ['피로', state.stats.fatigue]] as const).map(([label, value]) => <div key={label}><span>{label}</span><b><i style={{ width: `${value}%` }}/></b></div>)}</div>
    <button className="pet-stage" onClick={() => setPetted(true)} aria-label="루나 쓰다듬기"><Pet mood={petted ? 'shy' : 'happy'}/>{petted && <span className="heart-pop">♥</span>}</button>
    <div className="speech">{petted ? '헤헤… 주인님의 손은 따뜻해요!' : '오늘은 어떤 모험을 시작할까요?'}</div>
    <nav className="bottom-nav">{[
      ['calendar','스케줄',() => go('schedule')], ['bag','가방',() => undefined], ['quest','퀘스트',() => undefined], ['map','외출',() => undefined], ['heart','교감',() => setPetted(true)]
    ].map(([icon,label,fn]) => <button key={label as string} onClick={fn as () => void}><span><Icon name={icon as string}/></span><b>{label as string}</b></button>)}</nav>
  </section>;
}

function Schedule({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const ids = Object.keys(activities) as ActivityId[];
  const synergies = scheduleSynergies(state.schedule);
  const [selectedWeek,setSelectedWeek]=useState(0);
  const selectedIndex=Math.max(0,Math.min(state.schedule.length-1,selectedWeek));
  const selectedActivity=state.schedule[selectedIndex];
  const activityDescription=(id:ActivityId)=>id === 'rest'
    ? '회복 거점에서 피로와 스트레스를 정비'
    : id === 'herb'
      ? '약초 정원에서 채집과 지식 획득'
      : id === 'magic'
        ? '별빛 교실에서 마력과 룬 숙련'
        : '수호자 훈련장에서 전투 감각 성장';
  return <section className="screen schedule-screen rpg-schedule-board">
    <div className="rpg-schedule-board__backdrop"/>
    <header className="rpg-activity-header">
      <small>GUILD ACTIVITY BOARD</small>
      <h1>{state.month}월 활동 의뢰</h1>
      <span>{state.year}년차 · {state.month}월 · 주차별 활동 루트를 편성하세요.</span>
    </header>
    <div className="rpg-contract-layout">
      <section className="rpg-contract-list" aria-label="주차별 활동 의뢰">
        {state.schedule.map((id,index)=><button
          type="button"
          key={index}
          className={`rpg-contract${selectedIndex===index?' is-selected':''}`}
          aria-pressed={selectedIndex===index}
          onClick={()=>setSelectedWeek(index)}
        >
          <span className="rpg-contract__week">W{index+1}</span>
          <span className="rpg-contract__icon"><Icon name={activities[id].icon}/></span>
          <span className="rpg-contract__copy"><b>{activities[id].name}</b><small>{activityDescription(id)}</small></span>
          <span className="rpg-contract__status">{selectedIndex===index?'편집 중':'대기'}</span>
        </button>)}
      </section>
      <section className="rpg-contract-editor" aria-label={`${selectedIndex+1}주차 활동 변경`}>
        <small>WEEK {selectedIndex+1} · ROUTE SELECT</small>
        <strong>{selectedActivity?activities[selectedActivity].name:'활동 선택'}</strong>
        <p>{selectedActivity?activityDescription(selectedActivity):'이번 주 활동을 선택하세요.'}</p>
        <div className="rpg-activity-palette">{ids.map(id=><button
          type="button"
          key={id}
          className={selectedActivity===id?'is-active':''}
          aria-pressed={selectedActivity===id}
          onClick={()=>dispatch({type:'SET_SCHEDULE',index:selectedIndex,activity:id})}
        ><Icon name={activities[id].icon}/><span>{activities[id].name}</span></button>)}</div>
      </section>
    </div>
    <div className="schedule-synergy-summary rpg-schedule-synergy"><small>PARTY ROUTE BONUS</small>{synergies.length ? synergies.map(id => {
      const synergy = scheduleSynergyDefinitions.find(item => item.id === id);
      return <span key={id}><b>{synergy?.label}</b>{synergy?.description}</span>;
    }) : <span><b>기본 루트</b>활동 조합을 바꾸면 추가 성장 보너스가 생겨요.</span>}</div>
    <div className="planner-actions rpg-planner-actions"><button className="secondary" onClick={() => dispatch({type:'AUTO_SCHEDULE'})}>추천 루트 편성</button><button className="primary" onClick={() => dispatch({type:'GO',screen:'training'})}>활동 루트 출발</button></div>
  </section>;
}

function Training({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  return <TrainingActivityMinigame
    schedule={state.schedule}
    year={state.year}
    month={state.month}
    week={state.week}
    score={state.trainingScore}
    combo={state.combo}
    onTrain={(kind,accuracy)=>dispatch({type:'TRAIN',kind,accuracy})}
    onFinish={()=>dispatch({type:'FINISH_TRAINING',eventRoll:Math.random()})}
  />;
}

const eventDialogue: Record<RandomEventId, string> = {
  rare_herb: '돌아오는 길에 반짝이는 희귀 약초를 발견했어요!', new_move: '훈련하다가 새로운 움직임이 떠올랐어요. 다음엔 더 잘할 수 있어요!',
  magic_flow: '오늘은 마력이 정말 자연스럽게 흘렀어요.', second_wind: '힘들었는데 갑자기 다시 힘이 나는 것 같아요!',
  quiet_focus: '마음이 조용해지니까 주변이 더 또렷하게 보여요.', fox_curiosity: '궁금한 걸 따라가다 보니 새로운 걸 하나 배웠어요!',
};

function Dialogue({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const discovery = state.lastGrowthReport?.randomEvent;
  return <section className="screen dialogue-screen rpg-after-action-dialogue">
    <div className="story-forest"/>
    <header className="rpg-dialogue-context"><small>AFTER ACTION EVENT</small><strong>{discovery?'훈련 중 발견한 변화':'훈련을 마친 루나'}</strong><span>선택에 따라 관계와 상태가 달라집니다.</span></header>
    <div className="story-pet"><Pet mood="shy"/></div>
    <div className="dialogue-box rpg-dialogue-box">
      <div className="nameplate">RUNA · 루나</div>
      <p>{discovery ? eventDialogue[discovery] : <>오늘 활동 루트, 정말 재미있었어요!<br/>다음에는 더 멀리 가보고 싶어요.</>}</p>
      <div className="choices rpg-dialogue-choices">
        <button onClick={() => dispatch({type:'CHOOSE',choice:'hug'})}><b>따뜻하게 안아준다</b><small>호감도 ↑ · 스트레스 ↓</small></button>
        <button onClick={() => dispatch({type:'CHOOSE',choice:'scold'})}><b>다음 훈련을 점검한다</b><small>도덕성 ↑</small></button>
        <button onClick={() => dispatch({type:'CHOOSE',choice:'snack'})}><b>별빛 간식을 건넨다</b><small>100G · 스트레스 크게 ↓</small></button>
      </div>
    </div>
  </section>;
}

const statLabels: Record<string, string> = { strength: '근력', intelligence: '지식', magic: '마력', morality: '도덕성', affection: '호감도', stress: '스트레스', fatigue: '피로' };
const personalityLabels = { courage: '용감함', kindness: '다정함', curiosity: '호기심', calmness: '침착함' } as const;
const memoryLabels: Record<MemoryId, string> = {
  first_training: '첫 훈련', first_perfect: '첫 PERFECT', first_hug: '처음 나눈 포옹', first_snack: '처음 건넨 간식',
  first_s_grade: '첫 S등급', first_month_complete: '첫 달의 성장', first_skill: '처음 익힌 기술', close_bond: '가까워진 마음',
  first_outing: '첫 외출', forest_memory: '별빛 숲의 추억', village_memory: '마법 마을의 추억', lakeside_memory: '바람 호숫가의 추억', first_gift: '첫 선물',
};
const eventLabels: Record<RandomEventId, string> = {
  rare_herb: '희귀 약초 발견', new_move: '새로운 동작 발견', magic_flow: '마력의 흐름', second_wind: '두 번째 호흡', quiet_focus: '고요한 집중', fox_curiosity: '여우의 호기심',
};
const skillLabels: Record<SkillId, string> = { quick_strike: '빠른 일격', mana_focus: '마력 집중', steady_breath: '고른 호흡', trail_instinct: '길찾기 감각' };

function Result({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const grade = trainingGrade(state.trainingScore);
  const report = state.lastGrowthReport;
  const topPersonality = report ? (Object.entries(report.personalityDeltas) as Array<[keyof typeof personalityLabels, number]>).sort((a, b) => b[1] - a[1])[0] : undefined;
  const topMastery = report ? (Object.entries(report.masteryLevels) as Array<[ActivityId, number]>).sort((a, b) => b[1] - a[1])[0] : undefined;
  const memory = report?.newMemories[0];
  const discoveryLabel = report?.unlockedSkill ? '새 기술 해금' : report?.randomEvent ? '새로운 발견' : memory ? '새로운 기억' : '현재 컨디션';
  const discoveryValue = report?.unlockedSkill ? skillLabels[report.unlockedSkill] : report?.randomEvent ? eventLabels[report.randomEvent] : memory ? memoryLabels[memory] : state.condition;
  const synergyLabels = state.lastScheduleSynergies.map(id => scheduleSynergyDefinitions.find(item => item.id === id)?.label).filter(Boolean);
  const focus = monthlyFocusDefinitions.find(item => item.id === state.monthlyFocus) ?? monthlyFocusDefinitions[0];
  return <section className="screen result-screen rpg-result-debrief">
    <div className="result-rays"/><header className="rpg-result-header"><small>QUEST DEBRIEF · MONTHLY REPORT</small><div className={`grade grade-${grade}`}>{grade}</div><h1>{state.month}월 활동 결과</h1></header>
    <p>{report ? `${report.quality} · 이번 달 활동 루트의 변화가 기록됐어요.` : '루나는 이번 달에도 한 뼘 더 성장했어요.'}</p>
    <div className="result-card">
      <div><span>가장 큰 성장</span><b>{report?.topStat ? `${statLabels[report.topStat.key]} +${report.topStat.delta}` : `근력 ${state.stats.strength}`}</b></div>
      <div><span>훈련 숙련도</span><b>{topMastery ? `${activities[topMastery[0]].name} Lv.${topMastery[1]}` : `마력 ${state.stats.magic}`}</b></div>
      <div><span>성향 변화</span><b>{topPersonality ? `${personalityLabels[topPersonality[0]]} +${topPersonality[1]}` : `호감도 ${state.stats.affection}`}</b></div>
      <div><span>{discoveryLabel}</span><b>{discoveryValue}</b></div>
      <div><span>월간 성장 방침</span><b>{focus.label}</b></div>
      <div><span>발동한 계획 시너지</span><b>{synergyLabels.length ? synergyLabels.join(' · ') : '없음'}</b></div>
    </div>
    <div className="reward"><img className="reward-chest" src="/assets/reward/reward_chest_closed.png" alt=""/><span>활동 루트 보상</span><b>350 G</b></div>
    <button className="primary next-month" onClick={() => dispatch({type:'NEXT_MONTH'})}>월드로 돌아가 다음 달 시작</button>
  </section>;
}

type AppProps = {
  onStateChange?: (state: GameState) => void;
  onNavigateReady?: (navigate: (screen: Screen) => void) => void;
  onClaimAchievementReady?: (claim: (achievement: AchievementId) => void) => void;
  onOutingReady?: (outing: (location: OutingLocationId) => void) => void;
  onGiftReady?: (gift: (item: GiftItemId) => void) => void;
  onAttendanceReady?: (claim: () => void) => void;
  onMailReady?: (claim: (mail: MailRewardId) => void) => void;
  onMonthlyFocusReady?: (setFocus: (focus: GameState['monthlyFocus']) => void) => void;
  onYearlyAmbitionReady?: (setAmbition: (ambition: YearlyAmbitionId) => void) => void;
  onExpeditionFinishReady?: (finish: (stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number, actionKinds: ExpeditionActionCounts) => void) => void;
  onExpeditionEquipReady?: (equip: (relic: ExpeditionRelicId) => void) => void;
  onExpeditionUnequipReady?: (unequip: (relic: ExpeditionRelicId) => void) => void;
  onExpeditionCraftReady?: (craft: (recipe: ExpeditionCraftingRecipeId) => void) => void;
  onGuardianCallingReady?: (setCalling: (calling: GuardianCallingId) => void) => void;
  onGrowthTraitReady?: (purchase: (trait: GrowthTraitId) => void) => void;
  onSeasonPurchaseReady?: (purchase: (offer: SeasonShopOfferId) => void) => void;
  onSeasonLegacyUnlockReady?: (unlock: (nodeId: SeasonLegacyNodeId) => void) => void;
  onSanctuaryUpgradeReady?: (upgrade: (facility: SanctuaryFacilityId) => void) => void;
  onSanctuarySpecializationReady?: (select: (specialization: SanctuarySpecializationId) => void) => void;
  onSanctuaryMasterworkReady?: (build: (masterwork: SanctuaryMasterworkId) => void) => void;
  onAstralRiftClearReady?: (clear: (riftId: AstralRiftId, intensity: AstralRiftIntensity) => void) => void;
  onAstralRiftRelicReady?: (purchase: (relicId: AstralRiftRelicId) => void) => void;
  onTacticalPartyReady?: (setParty:(companions:[CompanionId,CompanionId])=>void) => void;
  onTacticalPreferencesReady?: (setPreferences:(auto:boolean,speed:1|2)=>void) => void;
  onTacticalCompleteReady?: (complete:(encounterId:TacticalEncounterId,result:BattleResult,rounds:number,survivingAllies:number,damageTaken:number,companions:[CompanionId,CompanionId])=>void) => void;
  onWeeklyFocusReady?: (select:(focus:WeeklyFocusId)=>void) => void;
  onWeeklyCompleteReady?: (complete:()=>void) => void;
  onWeeklyAdvanceReady?: (advance:()=>void) => void;
};

export default function App({ onStateChange, onNavigateReady, onClaimAchievementReady, onOutingReady, onGiftReady, onAttendanceReady, onMailReady, onMonthlyFocusReady, onYearlyAmbitionReady, onExpeditionFinishReady, onExpeditionEquipReady, onExpeditionUnequipReady, onExpeditionCraftReady, onGuardianCallingReady, onGrowthTraitReady, onSeasonPurchaseReady, onSeasonLegacyUnlockReady, onSanctuaryUpgradeReady, onSanctuarySpecializationReady, onSanctuaryMasterworkReady, onAstralRiftClearReady, onAstralRiftRelicReady, onTacticalPartyReady, onTacticalPreferencesReady, onTacticalCompleteReady, onWeeklyFocusReady, onWeeklyCompleteReady, onWeeklyAdvanceReady }: AppProps = {}) {
  const [state, dispatch] = useReducer(appReducer, initialState, () => loadProductionState(localStorage, reportClientTelemetry));
  const navigate = useCallback((screen: Screen) => dispatch({ type: 'GO', screen }), []);
  const claimAchievement = useCallback((achievement: AchievementId) => dispatch({ type: 'CLAIM_ACHIEVEMENT', achievement }), []);
  const goOuting = useCallback((location: OutingLocationId) => dispatch({ type: 'GO_OUTING', location }), []);
  const giveGift = useCallback((item: GiftItemId) => dispatch({ type: 'GIVE_GIFT', item }), []);
  const claimAttendance = useCallback(() => dispatch({ type: 'CLAIM_ATTENDANCE' }), []);
  const claimMail = useCallback((mail: MailRewardId) => dispatch({ type: 'CLAIM_MAIL', mail }), []);
  const setMonthlyFocus = useCallback((focus: GameState['monthlyFocus']) => dispatch({ type: 'SET_MONTHLY_FOCUS', focus }), []);
  const setYearlyAmbition = useCallback((ambition: YearlyAmbitionId) => dispatch({ type: 'SET_YEARLY_AMBITION', ambition }), []);
  const finishExpedition = useCallback((stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number, actionKinds: ExpeditionActionCounts) => dispatch({ type: 'FINISH_EXPEDITION_STAGE', stageId, score, fatigueDelta, stressDelta, actionKinds }), []);
  const equipExpeditionRelic = useCallback((relic: ExpeditionRelicId) => dispatch({ type: 'EQUIP_EXPEDITION_RELIC', relic }), []);
  const unequipExpeditionRelic = useCallback((relic: ExpeditionRelicId) => dispatch({ type: 'UNEQUIP_EXPEDITION_RELIC', relic }), []);
  const craftExpeditionRecipe = useCallback((recipe: ExpeditionCraftingRecipeId) => dispatch({ type: 'CRAFT_EXPEDITION_RECIPE', recipe }), []);
  const setGuardianCalling = useCallback((calling: GuardianCallingId) => dispatch({ type:'SET_GUARDIAN_CALLING', calling }), []);
  const purchaseGrowthTrait = useCallback((trait: GrowthTraitId) => dispatch({ type:'PURCHASE_GROWTH_TRAIT', trait }), []);
  const purchaseSeasonOffer = useCallback((offerId: SeasonShopOfferId) => dispatch({ type:'PURCHASE_SEASON_OFFER', offerId }), []);
  const unlockSeasonLegacyNode = useCallback((nodeId: SeasonLegacyNodeId) => dispatch({ type:'UNLOCK_SEASON_LEGACY_NODE', nodeId }), []);
  const upgradeSanctuary = useCallback((facility: SanctuaryFacilityId) => dispatch({ type:'UPGRADE_SANCTUARY', facility }), []);
  const selectSanctuarySpecialization = useCallback((specialization: SanctuarySpecializationId) => dispatch({ type:'SET_SANCTUARY_SPECIALIZATION', specialization }), []);
  const buildSanctuaryMasterwork = useCallback((masterwork: SanctuaryMasterworkId) => dispatch({ type:'BUILD_SANCTUARY_MASTERWORK', masterwork }), []);
  const clearAstralRift = useCallback((riftId: AstralRiftId, intensity: AstralRiftIntensity) => dispatch({ type:'CLEAR_ASTRAL_RIFT', riftId, intensity }), []);
  const purchaseAstralRiftRelic = useCallback((relicId: AstralRiftRelicId) => dispatch({ type:'PURCHASE_ASTRAL_RIFT_RELIC', relicId }), []);
  const setTacticalParty = useCallback((companions:[CompanionId,CompanionId]) => dispatch({ type:'SET_TACTICAL_PARTY', companions }), []);
  const setTacticalPreferences = useCallback((auto:boolean,speed:1|2) => dispatch({ type:'SET_TACTICAL_PREFERENCES', auto, speed }), []);
  const completeTacticalBattle = useCallback((encounterId:TacticalEncounterId,result:BattleResult,rounds:number,survivingAllies:number,damageTaken:number,companions:[CompanionId,CompanionId]) => dispatch({ type:'COMPLETE_TACTICAL_BATTLE', encounterId, result, rounds, survivingAllies, damageTaken, companions }), []);
  const selectWeeklyFocus = useCallback((focus:WeeklyFocusId) => dispatch({type:'SELECT_WEEKLY_FOCUS',focus}), []);
  const completeWeeklyFocus = useCallback(() => dispatch({type:'COMPLETE_WEEKLY_FOCUS'}), []);
  const advanceWeek = useCallback(() => dispatch({type:'ADVANCE_WEEK'}), []);
  const startNextGeneration = useCallback(() => dispatch({type:'START_NEXT_GENERATION'}), []);
  useEffect(() => {
    const handleStartNextGeneration=()=>startNextGeneration();
    window.addEventListener(nextGenerationRequestEvent,handleStartNextGeneration);
    return ()=>window.removeEventListener(nextGenerationRequestEvent,handleStartNextGeneration);
  },[startNextGeneration]);
  useEffect(() => {
    const handleStartPublicProject=(event:Event)=>{
      const projectId=(event as CustomEvent<PublicProjectId>).detail;
      if(projectId)dispatch({type:'START_PUBLIC_PROJECT',projectId});
    };
    window.addEventListener(publicProjectRequestEvent,handleStartPublicProject);
    return ()=>window.removeEventListener(publicProjectRequestEvent,handleStartPublicProject);
  },[]);
  useEffect(() => {
    const handleV12Build=(event:Event)=>{
      const request=(event as CustomEvent<V12BuildRequest>).detail;
      if(!request)return;
      if(request.type==='party')dispatch({type:'SET_V12_PARTY',party:request.party,leader:request.leader});
      else if(request.type==='outfit')dispatch({type:'SET_V12_OUTFIT',outfitId:request.outfitId});
      else if(request.type==='equipment')dispatch({type:'SET_V12_EQUIPMENT',equipmentId:request.equipmentId});
      else if(request.type==='begin-run')dispatch({type:'BEGIN_V12_RUN'});
      else if(request.type==='end-run')dispatch({type:'END_V12_RUN'});
    };
    window.addEventListener(v12BuildRequestEvent,handleV12Build);
    return ()=>window.removeEventListener(v12BuildRequestEvent,handleV12Build);
  },[]);
  useEffect(() => {
    const handleLivingRegionUpdate=(event:Event)=>{
      const request=(event as CustomEvent<LivingRegionUpdateRequest>).detail;
      if(request)dispatch({type:'UPDATE_LIVING_REGION_BATCH',regionId:request.regionId,updates:request.updates});
    };
    window.addEventListener(livingRegionUpdateRequestEvent,handleLivingRegionUpdate);
    return ()=>window.removeEventListener(livingRegionUpdateRequestEvent,handleLivingRegionUpdate);
  },[]);
  useEffect(() => {
    const handleOpenAdventureUpdate=(event:Event)=>{
      const update=(event as CustomEvent<OpenAdventureUpdate>).detail;
      if(update)dispatch({type:'UPDATE_OPEN_ADVENTURE',update});
    };
    window.addEventListener(openAdventureUpdateRequestEvent,handleOpenAdventureUpdate);
    return ()=>window.removeEventListener(openAdventureUpdateRequestEvent,handleOpenAdventureUpdate);
  },[]);
  useEffect(() => {
    writeProductionState(localStorage, state, reportClientTelemetry);
  }, [state]);
  useEffect(() => onStateChange?.(state), [state, onStateChange]);
  useEffect(() => onNavigateReady?.(navigate), [navigate, onNavigateReady]);
  useEffect(() => onClaimAchievementReady?.(claimAchievement), [claimAchievement, onClaimAchievementReady]);
  useEffect(() => onOutingReady?.(goOuting), [goOuting, onOutingReady]);
  useEffect(() => onGiftReady?.(giveGift), [giveGift, onGiftReady]);
  useEffect(() => onAttendanceReady?.(claimAttendance), [claimAttendance, onAttendanceReady]);
  useEffect(() => onMailReady?.(claimMail), [claimMail, onMailReady]);
  useEffect(() => onMonthlyFocusReady?.(setMonthlyFocus), [setMonthlyFocus, onMonthlyFocusReady]);
  useEffect(() => onYearlyAmbitionReady?.(setYearlyAmbition), [setYearlyAmbition, onYearlyAmbitionReady]);
  useEffect(() => onExpeditionFinishReady?.(finishExpedition), [finishExpedition, onExpeditionFinishReady]);
  useEffect(() => onExpeditionEquipReady?.(equipExpeditionRelic), [equipExpeditionRelic, onExpeditionEquipReady]);
  useEffect(() => onExpeditionUnequipReady?.(unequipExpeditionRelic), [unequipExpeditionRelic, onExpeditionUnequipReady]);
  useEffect(() => onExpeditionCraftReady?.(craftExpeditionRecipe), [craftExpeditionRecipe, onExpeditionCraftReady]);
  useEffect(() => onGuardianCallingReady?.(setGuardianCalling), [setGuardianCalling, onGuardianCallingReady]);
  useEffect(() => onGrowthTraitReady?.(purchaseGrowthTrait), [purchaseGrowthTrait, onGrowthTraitReady]);
  useEffect(() => onSeasonPurchaseReady?.(purchaseSeasonOffer), [purchaseSeasonOffer, onSeasonPurchaseReady]);
  useEffect(() => onSeasonLegacyUnlockReady?.(unlockSeasonLegacyNode), [unlockSeasonLegacyNode, onSeasonLegacyUnlockReady]);
  useEffect(() => onSanctuaryUpgradeReady?.(upgradeSanctuary), [upgradeSanctuary,onSanctuaryUpgradeReady]);
  useEffect(() => onSanctuarySpecializationReady?.(selectSanctuarySpecialization), [selectSanctuarySpecialization,onSanctuarySpecializationReady]);
  useEffect(() => onSanctuaryMasterworkReady?.(buildSanctuaryMasterwork), [buildSanctuaryMasterwork,onSanctuaryMasterworkReady]);
  useEffect(() => onAstralRiftClearReady?.(clearAstralRift), [clearAstralRift,onAstralRiftClearReady]);
  useEffect(() => onAstralRiftRelicReady?.(purchaseAstralRiftRelic), [purchaseAstralRiftRelic,onAstralRiftRelicReady]);
  useEffect(() => onTacticalPartyReady?.(setTacticalParty), [setTacticalParty,onTacticalPartyReady]);
  useEffect(() => onTacticalPreferencesReady?.(setTacticalPreferences), [setTacticalPreferences,onTacticalPreferencesReady]);
  useEffect(() => onTacticalCompleteReady?.(completeTacticalBattle), [completeTacticalBattle,onTacticalCompleteReady]);
  useEffect(() => onWeeklyFocusReady?.(selectWeeklyFocus), [selectWeeklyFocus,onWeeklyFocusReady]);
  useEffect(() => onWeeklyCompleteReady?.(completeWeeklyFocus), [completeWeeklyFocus,onWeeklyCompleteReady]);
  useEffect(() => onWeeklyAdvanceReady?.(advanceWeek), [advanceWeek,onWeeklyAdvanceReady]);

  return <main className="page"><div className="game-shell"><div className="ornate-corners"><i/><i/><i/><i/></div>{state.screen === 'hub' && <Hub state={state} go={() => navigate('schedule')}/>} {state.screen === 'schedule' && <Schedule state={state} dispatch={dispatch}/>} {state.screen === 'training' && <Training state={state} dispatch={dispatch}/>} {state.screen === 'dialogue' && <Dialogue state={state} dispatch={dispatch}/>} {state.screen === 'result' && <Result state={state} dispatch={dispatch}/>}</div></main>;
}
