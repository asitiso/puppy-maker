import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { GiftItemId, OutingLocationId } from './adventure';
import {
  activities,
  hydrateGameState,
  initialState,
  reducer,
  trainingGrade,
  type AchievementId,
  type ActivityId,
  type ExpeditionCraftingRecipeId,
  type ExpeditionRelicId,
  type ExpeditionStageId,
  type GameState,
  type MailRewardId,
  type MemoryId,
  type RandomEventId,
  type Screen,
  type SkillId,
  type YearlyAmbitionId,
} from './game';
import { monthlyFocusDefinitions } from './monthly-focus';
import { scheduleSynergies, scheduleSynergyDefinitions } from './schedule-synergies';
import { readAmbitionSelections } from './yearly-ambition-selection';

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
  return <section className="screen diary-screen">
    <div className="diary-bg"/>
    <div className="screen-title"><small>MONTHLY PLAN</small><h1>{state.month}월 성장 다이어리</h1></div>
    <div className="book"><div className="book-ring"/><div className="week-list">
      {state.schedule.map((id, index) => <div className="week-row" key={index}><span className="week-label">{index + 1}<small>WEEK</small></span><div className={`activity-card activity-${id}`}><span><Icon name={activities[id].icon}/></span><div><b>{activities[id].name}</b><small>{id === 'rest' ? '피로와 스트레스 회복' : id === 'herb' ? '골드와 지식 획득' : '핵심 능력치 성장'}</small></div></div><button className="cycle" onClick={() => dispatch({ type:'SET_SCHEDULE', index, activity: ids[(ids.indexOf(id)+1)%ids.length] })}>↻</button></div>)}
    </div><div className="activity-palette">{ids.map(id => <button key={id} onClick={() => dispatch({ type:'SET_SCHEDULE', index: 0, activity:id })}><Icon name={activities[id].icon}/><span>{activities[id].name}</span></button>)}</div></div>
    <div className="schedule-synergy-summary"><small>PLAN SYNERGY</small>{synergies.length ? synergies.map(id => {
      const synergy = scheduleSynergyDefinitions.find(item => item.id === id);
      return <span key={id}><b>{synergy?.label}</b>{synergy?.description}</span>;
    }) : <span><b>기본 계획</b>활동 조합을 바꾸면 추가 성장 보너스가 생겨요.</span>}</div>
    <Pet mood="focus"/>
    <div className="planner-actions"><button className="secondary" onClick={() => dispatch({type:'AUTO_SCHEDULE'})}>자동 배치</button><button className="primary" onClick={() => dispatch({type:'GO',screen:'training'})}>일정 시작</button></div>
  </section>;
}

function Training({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const [needle, setNeedle] = useState(0.1);
  const [flash, setFlash] = useState('');
  useEffect(() => { const id = setInterval(() => setNeedle(v => (v + .037) % 1), 40); return () => clearInterval(id); }, []);
  const accuracy = useMemo(() => 1 - Math.min(1, Math.abs(.5 - needle) * 2), [needle]);
  const hit = (kind: 'attack'|'dodge'|'charge') => { dispatch({type:'TRAIN',kind,accuracy}); setFlash(accuracy > .7 ? 'PERFECT!' : accuracy > .45 ? 'GOOD!' : 'MISS'); setTimeout(() => setFlash(''), 500); };
  return <section className="screen training-screen">
    <div className="forest-arena"><div className="moon-orb"/><div className="trees"/><div className="mist"/></div>
    <div className="battle-hud"><div><small>COMBO</small><b>{state.combo}</b></div><div className="score"><span>SCORE</span><b>{state.trainingScore}</b></div><button onClick={() => dispatch({type:'FINISH_TRAINING', eventRoll: Math.random()})}>훈련 종료</button></div>
    <div className="dummy"><span/><i/><b/></div><div className="fighter"><Pet mood="focus"/></div>
    <div className="timing-ring"><div className="sweet-spot"/><i style={{transform:`rotate(${needle*360}deg)`}}/>{flash && <img className="training-burst" src="/assets/effects/success_burst.png" alt=""/>}<span>{flash}</span></div>
    <div className="action-bar"><button className="attack" onClick={() => hit('attack')}><Icon name="sword"/><b>공격</b></button><button className="dodge" onClick={() => hit('dodge')}><span>◒</span><b>회피</b></button><button className="charge" onClick={() => hit('charge')}><Icon name="spark"/><b>기 모으기</b></button></div>
  </section>;
}

const eventDialogue: Record<RandomEventId, string> = {
  rare_herb: '돌아오는 길에 반짝이는 희귀 약초를 발견했어요!', new_move: '훈련하다가 새로운 움직임이 떠올랐어요. 다음엔 더 잘할 수 있어요!',
  magic_flow: '오늘은 마력이 정말 자연스럽게 흘렀어요.', second_wind: '힘들었는데 갑자기 다시 힘이 나는 것 같아요!',
  quiet_focus: '마음이 조용해지니까 주변이 더 또렷하게 보여요.', fox_curiosity: '궁금한 걸 따라가다 보니 새로운 걸 하나 배웠어요!',
};

function Dialogue({ state, dispatch }: { state: typeof initialState; dispatch: React.Dispatch<any> }) {
  const discovery = state.lastGrowthReport?.randomEvent;
  return <section className="screen dialogue-screen"><div className="story-forest"/><div className="story-pet"><Pet mood="shy"/></div><div className="dialogue-box"><div className="nameplate">RUNA · 루나</div><p>{discovery ? eventDialogue[discovery] : <>오늘 사냥 수업, 정말 재미있었어요!<br/>주인님과 함께라면 뭐든 할 수 있을 것 같아요.</>}</p><div className="choices"><button onClick={() => dispatch({type:'CHOOSE',choice:'hug'})}>따뜻하게 안아준다 <small>호감도 ↑ 스트레스 ↓</small></button><button onClick={() => dispatch({type:'CHOOSE',choice:'scold'})}>조금 더 엄하게 지도한다 <small>도덕성 ↑</small></button><button onClick={() => dispatch({type:'CHOOSE',choice:'snack'})}>별빛 간식을 건넨다 <small>100G · 스트레스 크게 ↓</small></button></div></div></section>;
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
  return <section className="screen result-screen">
    <div className="result-rays"/><div className={`grade grade-${grade}`}>{grade}</div><h1>{state.month}월 성장 기록</h1>
    <p>{report ? `${report.quality} · 이번 달 루나의 변화가 기록됐어요.` : '루나는 이번 달에도 한 뼘 더 성장했어요.'}</p>
    <div className="result-card">
      <div><span>가장 큰 성장</span><b>{report?.topStat ? `${statLabels[report.topStat.key]} +${report.topStat.delta}` : `근력 ${state.stats.strength}`}</b></div>
      <div><span>훈련 숙련도</span><b>{topMastery ? `${activities[topMastery[0]].name} Lv.${topMastery[1]}` : `마력 ${state.stats.magic}`}</b></div>
      <div><span>성향 변화</span><b>{topPersonality ? `${personalityLabels[topPersonality[0]]} +${topPersonality[1]}` : `호감도 ${state.stats.affection}`}</b></div>
      <div><span>{discoveryLabel}</span><b>{discoveryValue}</b></div>
      <div><span>월간 성장 방침</span><b>{focus.label}</b></div>
      <div><span>발동한 계획 시너지</span><b>{synergyLabels.length ? synergyLabels.join(' · ') : '없음'}</b></div>
    </div>
    <div className="reward"><img className="reward-chest" src="/assets/reward/reward_chest_closed.png" alt=""/><span>월간 보상</span><b>350 G</b></div>
    <button className="primary next-month" onClick={() => dispatch({type:'NEXT_MONTH'})}>다음 달 시작</button>
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
  onExpeditionFinishReady?: (finish: (stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number) => void) => void;
  onExpeditionEquipReady?: (equip: (relic: ExpeditionRelicId) => void) => void;
  onExpeditionUnequipReady?: (unequip: (relic: ExpeditionRelicId) => void) => void;
  onExpeditionCraftReady?: (craft: (recipe: ExpeditionCraftingRecipeId) => void) => void;
};

export default function App({ onStateChange, onNavigateReady, onClaimAchievementReady, onOutingReady, onGiftReady, onAttendanceReady, onMailReady, onMonthlyFocusReady, onYearlyAmbitionReady, onExpeditionFinishReady, onExpeditionEquipReady, onExpeditionUnequipReady, onExpeditionCraftReady }: AppProps = {}) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const raw = JSON.parse(localStorage.getItem('puppy-maker-save') || 'null');
      const hydrated = hydrateGameState(raw);
      const legacyAmbitions = readAmbitionSelections(JSON.parse(localStorage.getItem('puppy-maker-yearly-ambitions') || '{}'));
      return { ...hydrated, yearlyAmbitions: { ...legacyAmbitions, ...hydrated.yearlyAmbitions } };
    } catch {
      return hydrateGameState(null);
    }
  });
  const navigate = useCallback((screen: Screen) => dispatch({ type: 'GO', screen }), []);
  const claimAchievement = useCallback((achievement: AchievementId) => dispatch({ type: 'CLAIM_ACHIEVEMENT', achievement }), []);
  const goOuting = useCallback((location: OutingLocationId) => dispatch({ type: 'GO_OUTING', location }), []);
  const giveGift = useCallback((item: GiftItemId) => dispatch({ type: 'GIVE_GIFT', item }), []);
  const claimAttendance = useCallback(() => dispatch({ type: 'CLAIM_ATTENDANCE' }), []);
  const claimMail = useCallback((mail: MailRewardId) => dispatch({ type: 'CLAIM_MAIL', mail }), []);
  const setMonthlyFocus = useCallback((focus: GameState['monthlyFocus']) => dispatch({ type: 'SET_MONTHLY_FOCUS', focus }), []);
  const setYearlyAmbition = useCallback((ambition: YearlyAmbitionId) => dispatch({ type: 'SET_YEARLY_AMBITION', ambition }), []);
  const finishExpedition = useCallback((stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number) => dispatch({ type: 'FINISH_EXPEDITION_STAGE', stageId, score, fatigueDelta, stressDelta }), []);
  const equipExpeditionRelic = useCallback((relic: ExpeditionRelicId) => dispatch({ type: 'EQUIP_EXPEDITION_RELIC', relic }), []);
  const unequipExpeditionRelic = useCallback((relic: ExpeditionRelicId) => dispatch({ type: 'UNEQUIP_EXPEDITION_RELIC', relic }), []);
  const craftExpeditionRecipe = useCallback((recipe: ExpeditionCraftingRecipeId) => dispatch({ type: 'CRAFT_EXPEDITION_RECIPE', recipe }), []);
  useEffect(() => {
    localStorage.setItem('puppy-maker-save', JSON.stringify(state));
    localStorage.removeItem('puppy-maker-yearly-ambitions');
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

  return <main className="page"><div className="game-shell"><div className="ornate-corners"><i/><i/><i/><i/></div>{state.screen === 'hub' && <Hub state={state} go={() => navigate('schedule')}/>} {state.screen === 'schedule' && <Schedule state={state} dispatch={dispatch}/>} {state.screen === 'training' && <Training state={state} dispatch={dispatch}/>} {state.screen === 'dialogue' && <Dialogue state={state} dispatch={dispatch}/>} {state.screen === 'result' && <Result state={state} dispatch={dispatch}/>}</div></main>;
}
