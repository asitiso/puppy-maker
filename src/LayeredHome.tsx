import { useCallback, useEffect, useRef, useState } from 'react';
import {
  discoveryIds,
  explorationLevel,
  explorationXpForNextLevel,
  giftDefinitions,
  giftItemIds,
  outingDefinitions,
  outingLocationIds,
  type DiscoveryId,
  type ExplorationEventId,
  type GiftItemId,
  type OutingLocationId,
} from './adventure';
import {
  achievementDefinitions,
  collectionProgress,
  currentAdvancedTalents,
  currentAvailableMail,
  currentCareerTitles,
  currentGuardianStatus,
  currentStoryChapters,
  eligibleAchievements,
  masteryLevel,
  relationshipRank,
  type AchievementId,
  type GameState,
  type MailRewardId,
} from './game';
import { attendanceKey, attendanceReward } from './attendance';
import { talentDefinitions } from './advanced-talents';
import { careerTitleDefinitions } from './career-records';
import { guardianRankDefinitions } from './guardian-rank';
import { hubGuidedActionStack } from './hub-next-action';
import type { GuidedActionRoute } from './guided-actions';
import { mailDefinitions } from './mail-rewards';
import { monthlyFocusDefinitions } from './monthly-focus';
import { monthlyMissionDefinitions } from './monthly-missions';
import { storyChapterDefinitions } from './story-chapters';
import { getHomePanel, type HomeMenuId } from './home-panels';
import HomeCommandCenter from './HomeCommandCenter';
import InformationPanel from './InformationPanel';
import RunGuidanceCard from './RunGuidanceCard';
import { getRunGuidance } from './run-guidance';
import WeeklyPlannerCard from './WeeklyPlannerCard';
import type { WeeklyFocusId } from './weekly-life';
import MobileSceneBackground from './MobileSceneBackground';
import MobileCharacterArt from './MobileCharacterArt';
import SceneStage from './scene/SceneStage';
import {resolveScene} from './scene/scene-resolver';
import type {ResolvedSceneInteraction,Weather} from './scene/scene-types';
import { useOverlayFocusManagement } from './useOverlayFocusManagement'
import './scene/scene.css';

function Frame({ src, alt = '' }: { src: string; alt?: string }) {
  return <img className="lh-frame" src={src} alt={alt} draggable={false} />;
}

const iconPaths: Record<string, string> = {
  gift: 'M5 10h14v10H5zM4 7h16v4H4zM12 7v13M8.2 7C5.8 7 5.3 3.8 7.6 3.4 9.5 3 11 5.3 12 7c1-1.7 2.5-4 4.4-3.6 2.3.4 1.8 3.6-.6 3.6',
  event: 'M5 6h14v14H5zM8 3v5m8-5v5M5 10h14M9 14l2 2 4-4',
  mail: 'M4 7h16v11H4zM4 8l8 6 8-6',
  scroll: 'M7 4h10a2 2 0 012 2v12H7a2 2 0 010-4h10M7 4a2 2 0 000 4h10M10 10h5m-5 3h5',
  calendar: 'M5 6h14v14H5zM8 3v5m8-5v5M5 10h14M8 14h3m2 0h3m-8 3h3m2 0h3',
  bag: 'M6 9h12l1 11H5L6 9zm4 0V6a2 2 0 014 0v3',
  quest: 'M7 4h10v16H7zM10 8h4m-4 4h4m-4 4h3M5 7h2m-2 5h2m-2 5h2',
  map: 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2V6zm5-2v14m6-12v14',
  heart: 'M12 20S4 15.5 4 9.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.5 12 20 12 20z',
  gems: 'M12 3l6 5-6 12L6 8l6-5zm-6 5h12M9 8l3 12 3-12',
  paw: 'M12 13c-4 0-7 3-7 6 0 2 2 3 4 2 2-1 4-1 6 0 2 1 4 0 4-2 0-3-3-6-7-6zM7 8a2 3 0 110-6 2 3 0 010 6zm10 0a2 3 0 110-6 2 3 0 010 6zm-6-2a2 3 0 110-6 2 3 0 010 6zm2 0a2 3 0 110-6 2 3 0 010 6z'
};

function GameIcon({ name }: { name: string }) {
  return <svg className="game-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}

const shortcuts: Array<[string, string, HomeMenuId]> = [
  ['gift', '출석체크', 'attendance'], ['event', '이벤트', 'event'], ['mail', '우편함', 'mail'], ['scroll', '미션', 'mission']
];

const nav: Array<[string, string, HomeMenuId]> = [
  ['calendar', '스케줄', 'schedule'], ['bag', '가방', 'bag'], ['quest', '퀘스트', 'quest'], ['map', '외출', 'outing'], ['heart', '교감', 'bond']
];

const recommendations: Record<GameState['condition'], string> = {
  energetic: '몸이 가벼워요. 사냥 훈련이나 외출에 잘 맞는 날이에요.',
  normal: '오늘은 원하는 훈련이나 외출을 골라도 좋아요.',
  focused: '집중력이 좋아요. 마법 수업을 해볼까요?',
  tired: '오늘은 휴식을 넣거나 호숫가에 다녀오는 게 좋아요.',
};

const relationshipLabels = {
  acquaintance: '낯선 사이', familiar: '익숙한 사이', friend: '친구', close_friend: '가까운 친구', precious: '소중한 사람',
} as const;

const weatherLabels: Record<Weather,string> = {
  clear:'☀ 맑음', cloudy:'☁ 흐림', rain:'☂ 비', snow:'❄ 눈', mist:'◌ 안개',
};

const explorationEventLabels: Record<ExplorationEventId, string> = {
  glowing_tracks: '빛나는 발자국을 따라가 50G를 발견했어요.',
  ancient_tree: '오래된 나무의 선물로 별빛 쿠키를 얻었어요.',
  street_performance: '마을 공연을 도와 50G를 받았어요.',
  wand_repair: '마법 지팡이를 고쳐주고 여우 부적을 받았어요.',
  silver_fish: '은빛 물고기가 숨겨둔 50G를 발견했어요.',
  quiet_breeze: '고요한 바람 속에서 허브티를 발견했어요.',
};

const discoveryLabels: Record<DiscoveryId, string> = {
  moon_feather: '달빛 깃털', star_mushroom: '별무늬 버섯', tiny_bell: '작은 마법 종', old_spellbook: '낡은 주문서',
  glass_shell: '유리빛 조개', wind_crystal: '바람 결정',
};

type QuestView = 'all' | 'ready' | 'active' | 'done';
type BagView = 'all' | 'owned' | 'empty';

type LayeredHomeProps = {
  state: GameState;
  onSchedule: () => void;
  onClaimAchievement: (achievement: AchievementId) => void;
  onOuting: (location: OutingLocationId) => void;
  onGift: (item: GiftItemId) => void;
  onAttendance: () => void;
  onMail: (mail: MailRewardId) => void;
  onMonthlyFocus: (focus: GameState['monthlyFocus']) => void;
  onWeeklyFocus?: (focus: WeeklyFocusId) => void;
  onCompleteWeek?: () => void;
  onAdvanceWeek?: () => void;
  onExpedition?: () => void;
  onSeason?: () => void;
  onMenuReady?: (openMenu: (id: HomeMenuId) => void) => void;
  onMenuNavigate?: (id: HomeMenuId) => void;
  onWeeklyPlannerNavigate?: () => void;
};

export default function LayeredHome({ state, onSchedule, onClaimAchievement, onOuting, onGift, onAttendance, onMail, onMonthlyFocus, onWeeklyFocus, onCompleteWeek, onAdvanceWeek, onExpedition, onSeason, onMenuReady, onMenuNavigate, onWeeklyPlannerNavigate }: LayeredHomeProps) {
  const [petted, setPetted] = useState(false);
  const [activeNav, setActiveNav] = useState(-1);
  const [activePanel, setActivePanel] = useState<HomeMenuId | null>(null);
  const [questView, setQuestView] = useState<QuestView>('all');
  const [bagView, setBagView] = useState<BagView>('all');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const panelLauncherRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const panelCloseRef = useRef<HTMLButtonElement | null>(null);
  const outingTransitionRef = useRef(false);
  const plannerRef = useRef<HTMLDivElement | null>(null);
  const staticPanel = activePanel ? getHomePanel(activePanel) : null;
  const stamina = Math.max(0, 100 - state.stats.fatigue);
  const rank = relationshipRank(state.stats.affection);
  const collection = collectionProgress(state);
  const eligible = new Set(eligibleAchievements(state));
  const achievementRows = achievementDefinitions.map((item, index) => {
    const claimed = state.claimedAchievements.includes(item.id);
    const canClaim = eligible.has(item.id) && !claimed;
    const status: Exclude<QuestView, 'all'> = claimed ? 'done' : canClaim ? 'ready' : 'active';
    return { item, index, claimed, canClaim, status };
  });
  const readyAchievementCount = achievementRows.filter(row => row.status === 'ready').length;
  const activeAchievementCount = achievementRows.filter(row => row.status === 'active').length;
  const doneAchievementCount = achievementRows.filter(row => row.status === 'done').length;
  const achievementPriority: Record<Exclude<QuestView, 'all'>, number> = { ready: 0, active: 1, done: 2 };
  const visibleAchievements = achievementRows
    .filter(row => questView === 'all' || row.status === questView)
    .sort((a, b) => achievementPriority[a.status] - achievementPriority[b.status] || a.index - b.index);
  const unclaimedAchievementCount = readyAchievementCount;
  const giftRows = giftItemIds.map((id, index) => ({ id, index, item: giftDefinitions[id], quantity: state.inventory[id] ?? 0 }));
  const ownedGiftTypes = giftRows.filter(row => row.quantity > 0).length;
  const ownedGiftCount = giftRows.reduce((sum, row) => sum + Math.max(0, row.quantity), 0);
  const visibleGifts = giftRows.filter(row => bagView === 'all' || (bagView === 'owned' ? row.quantity > 0 : row.quantity <= 0));
  const guardian = currentGuardianStatus(state);
  const guardianDefinition = guardianRankDefinitions.find(item => item.id === guardian.rank) ?? guardianRankDefinitions[0];
  const guardianShortLabel = guardianDefinition.label.replace(' 수호자', '');
  const storyOpen = new Set([...currentStoryChapters(state), ...state.expeditionStoryEntries]);
  const talents = currentAdvancedTalents(state);
  const titles = currentCareerTitles(state);
  const currentTitle = careerTitleDefinitions.find(item => item.id === titles[titles.length - 1]);
  const talentLabels = talents.map(id => talentDefinitions.find(item => item.id === id)?.label).filter(Boolean);
  const highestMastery = Math.max(...Object.values(state.mastery).map(entry => masteryLevel(entry.xp)));
  const attendanceId = attendanceKey(state.year, state.month);
  const attendanceClaimed = state.claimedAttendanceMonths.includes(attendanceId);
  const attendance = attendanceReward(state.year, state.month);
  const availableMail = new Set(currentAvailableMail(state));
  const unclaimedMail = [...availableMail].filter(id => !state.claimedMailRewards.includes(id));
  const isQuestPanel = activePanel === 'quest';
  const isBondPanel = activePanel === 'bond';
  const isBagPanel = activePanel === 'bag';
  const isOutingPanel = activePanel === 'outing';
  const isMissionPanel = activePanel === 'mission';
  const isEventPanel = activePanel === 'event';
  const isAttendancePanel = activePanel === 'attendance';
  const isMailPanel = activePanel === 'mail';
  const hasPanel = Boolean(staticPanel || isQuestPanel || isBondPanel || isBagPanel || isOutingPanel || isMissionPanel || isEventPanel || isAttendancePanel || isMailPanel);
  const panelTitle = isQuestPanel ? '성장 업적' : isBondPanel ? '루나와의 교감' : isBagPanel ? '가방' : isOutingPanel ? '외출' : isMissionPanel ? '이번 달 도전' : isEventPanel ? '루나 이야기' : isAttendancePanel ? '월간 출석' : isMailPanel ? '우편함' : staticPanel?.title ?? '';
  const panelEyebrow = isQuestPanel ? 'ACHIEVEMENTS' : isBondPanel ? 'BOND & COLLECTION' : isBagPanel ? 'GIFTS' : isOutingPanel ? 'ADVENTURE' : isMissionPanel ? 'MONTHLY CHALLENGES' : isEventPanel ? 'STORY ARCHIVE' : isAttendancePanel ? 'MONTHLY CHECK-IN' : isMailPanel ? 'MILESTONE MAIL' : staticPanel?.eyebrow ?? '';
  const runGuidance = getRunGuidance(state);
  const guidedActions = hubGuidedActionStack(state);
  const homeScene=resolveScene({
    location:'home', year:state.year, month:state.month, week:state.week,
    campaignId:state.campaignRun.activeCampaign,
    worldFacts:state.worldHistory.currentFacts,
    inheritedWorldFacts:state.worldHistory.inheritedFacts,
    actorState:{condition:state.condition},
  });

  const handleMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 });
  };

  const openMenu = useCallback((id: HomeMenuId, index?: number) => {
    if (typeof index === 'number') setActiveNav(index); else setActiveNav(-1);
    if (onMenuNavigate) { onMenuNavigate(id); return; }
    if (id === 'schedule') return onSchedule();
    const activeElement = document.activeElement;
    panelLauncherRef.current = activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null;
    if (id === 'bond') setPetted(true);
    setActivePanel(id);
  }, [onMenuNavigate, onSchedule]);

  const handleHomeSceneInteraction=(interaction:ResolvedSceneInteraction)=>{
    switch(interaction.id){
      case 'runa':return openMenu('bond');
      case 'bed':return onWeeklyFocus?onWeeklyFocus('rest'):plannerRef.current?.querySelector<HTMLButtonElement>('[data-weekly-focus="rest"]')?.focus();
      case 'desk':return onSchedule();
      case 'wardrobe':
      case 'bag':return openMenu('bag');
      case 'door':
      case 'world_map':return openMenu('outing');
    }
  };

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setActiveNav(-1);
  }, []);

  useOverlayFocusManagement({
    open: Boolean(activePanel && hasPanel),
    onClose: closePanel,
    dialogRef: panelRef,
    launcherRef: panelLauncherRef,
    initialFocusRef: panelCloseRef,
  });

  const startOuting = (id: OutingLocationId) => {
    if (outingTransitionRef.current) return;
    outingTransitionRef.current = true;
    closePanel();
    onOuting(id);
  };

  const runGuidedAction = (route: GuidedActionRoute) => {
    switch (route) {
      case 'mail': return openMenu('mail');
      case 'attendance': return openMenu('attendance');
      case 'achievement': return openMenu('quest', 2);
      case 'weekly_planner': return onWeeklyPlannerNavigate ? onWeeklyPlannerNavigate() : plannerRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
      case 'advance_week': return onAdvanceWeek?.();
      case 'schedule': return onSchedule();
      case 'outing': return openMenu('outing');
      case 'bond': return openMenu('bond');
      case 'expedition':
      case 'tactical': return onExpedition?.();
      case 'season': return onSeason?.();
    }
  };

  useEffect(() => onMenuReady?.((id: HomeMenuId) => openMenu(id)), [openMenu, onMenuReady]);
  useEffect(() => {
    if (activePanel === 'outing') outingTransitionRef.current = false;
  }, [activePanel]);

  return <section className="layered-home" onPointerMove={handleMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })} style={{ '--px': tilt.x, '--py': tilt.y } as React.CSSProperties}>
    <div className="lh-scene-layer"><MobileSceneBackground slot="home.background" className="v9-home-background"/><div className="lh-window-light" /><div className="lh-fire-light" /><div className="lh-floor-glow" /></div>
    <div className="layered-vignette" /><div className="layered-particles" />
    <div className="lh-living-scene"><SceneStage scene={homeScene} onInteraction={handleHomeSceneInteraction}/></div>
    <button className="lh-character" onClick={() => setPetted(true)} aria-label="루나와 교감"><span className="lh-character-rim" /><MobileCharacterArt slot="home.hero" className="v9-home-hero"/></button>
    {petted && <img className="lh-heart" src="/assets/effects/affection_hearts.png" alt="" />}
    <div className="lh-level"><Frame src="/ui/level_badge_frame.png" /><div><small>RANK</small><strong>{guardian.points}</strong><span>{guardianShortLabel}</span></div></div>
    <div className="lh-currency"><Frame src="/ui/currency_hud_frame.png" /><div className="lh-currency-values"><span><i className="coin gold">●</i><b>{state.gold.toLocaleString()}</b></span><span><i className="coin gem">◆</i><b>{state.gems.toLocaleString()}</b></span></div><div className="lh-hp"><Frame src="/ui/stamina_hud_frame.png" /><i style={{ width: `${stamina}%` }} /><b>{stamina} / 100</b></div></div>
    <div className="lh-weather"><Frame src="/ui/info_card_frame.png" /><div><b>{state.month}월 {state.week}주차</b><span>{weatherLabels[homeScene.weather]}</span></div></div>
    <RunGuidanceCard guidance={runGuidance} />
    <div className="lh-weekly-planner" ref={plannerRef}><WeeklyPlannerCard state={state} onSelectFocus={focus => onWeeklyFocus?.(focus)} onComplete={() => onCompleteWeek?.()} onAdvance={() => onAdvanceWeek?.()} /></div>
    <div className="lh-shortcuts">{shortcuts.map(([icon, label, id]) => <button key={id} onClick={() => openMenu(id)}><Frame src="/ui/home_shortcut_button_frame.png" /><span className="lh-shortcut-icon"><GameIcon name={icon} /></span><b>{label}{id === 'mail' && unclaimedMail.length > 0 ? ` ${unclaimedMail.length}` : ''}</b></button>)}</div>
    <div className="lh-goal"><Frame src="/ui/weekly_goal_panel_frame.png" /><div><h3>성장 컬렉션</h3><p>기억 <b>{collection.memories}개</b></p><p>기술 <b>{collection.skills}개</b></p><p>발견물 <b>{state.discoveries.length} / {discoveryIds.length}</b></p></div></div>
    <div className="lh-promos"><button onClick={() => openMenu('event')}><span><GameIcon name="event" /></span><b>루나 이야기</b><small>{storyOpen.size} / {storyChapterDefinitions.length} 챕터</small></button><button onClick={() => openMenu('quest')}><span><GameIcon name="paw" /></span><b>성장 업적</b><small>{unclaimedAchievementCount}개 수령 가능</small></button></div>
    <HomeCommandCenter stack={guidedActions} onAction={runGuidedAction}/>
    <div className="lh-dialogue"><Frame src="/ui/dialogue_panel_frame.png" /><span className="lh-name">루나</span><p>{petted ? '헤헤… 주인님의 손은 정말 따뜻해요!' : `관계 · ${relationshipLabels[rank]} · ${guardianDefinition.label}`}<br/>{petted ? `우리 사이는 지금 '${relationshipLabels[rank]}'예요.` : recommendations[state.condition]}</p><i className="lh-dialogue-next">◆</i></div>
    <nav className="lh-bottom-nav">{nav.map(([icon, label, id], index) => <button key={id} className={activeNav === index ? 'is-active' : ''} onClick={() => openMenu(id, index)} aria-pressed={activeNav === index} aria-current={activeNav === index ? 'page' : undefined}><Frame src={activeNav === index ? '/ui/bottom_nav_button_active_frame.png' : '/ui/bottom_nav_button_frame.png'} /><span><GameIcon name={icon} /></span><b>{label}</b></button>)}</nav>

    {activePanel && hasPanel && <div className="lh-panel-backdrop" onClick={closePanel}>
      <section ref={panelRef} className="lh-panel" role="dialog" aria-modal="true" aria-label={panelTitle} onClick={event => event.stopPropagation()}>
        <header className="lh-panel-header"><div><small>{panelEyebrow}</small><h2>{panelTitle}</h2></div><button ref={panelCloseRef} className="lh-panel-close" onClick={closePanel} aria-label="홈으로 돌아가기">← 이전 화면</button></header>
        <div className="lh-panel-body">
        {isQuestPanel ? <InformationPanel summaryItems={[{ label:'수령 가능', value:readyAchievementCount },{ label:'진행 중', value:activeAchievementCount },{ label:'완료', value:doneAchievementCount }]} filters={[{id:'all',label:'전체',count:achievementRows.length},{id:'ready',label:'수령 가능',count:readyAchievementCount},{id:'active',label:'진행',count:activeAchievementCount},{id:'done',label:'완료',count:doneAchievementCount}]} activeFilter={questView} onFilterChange={id => setQuestView(id as QuestView)} emptyMessage="해당 상태의 업적이 없어요.">
          {visibleAchievements.length ? <div className="lh-panel-list v11-info-list">{visibleAchievements.map(({ item, index, claimed, canClaim }) => { const reward = item.reward.gold ? `${item.reward.gold}G` : `보석 ${item.reward.gems}`; return <button key={item.id} disabled={!canClaim} onClick={() => canClaim && onClaimAchievement(item.id)}><span>{claimed ? '✓' : canClaim ? '!' : index + 1}</span><b>{item.title}<small>{item.description} · {reward}</small></b><i>{claimed ? '완료' : canClaim ? '받기' : '진행중'}</i></button>; })}</div> : null}
        </InformationPanel> : isAttendancePanel ? <div className="lh-panel-list"><button disabled={attendanceClaimed} onClick={() => !attendanceClaimed && onAttendance()}><span>{attendanceClaimed ? '✓' : '!'}</span><b>{state.year}년차 {state.month}월 출석 보상<small>기본 150G{attendance.gems > 0 ? ` · 분기 보너스 보석 ${attendance.gems}개` : ' · 다음 분기월에는 보석 보너스'}</small></b><i>{attendanceClaimed ? '수령 완료' : '받기'}</i></button><button disabled><span>◆</span><b>누적 출석 기록<small>월이 바뀌어도 이전 수령 기록은 유지돼요.</small></b><i>{state.claimedAttendanceMonths.length}개월</i></button></div>
        : isMailPanel ? <div className="lh-panel-list">{mailDefinitions.map((mail, index) => { const unlocked = availableMail.has(mail.id); const claimed = state.claimedMailRewards.includes(mail.id); const reward = [mail.reward.gold ? `${mail.reward.gold}G` : '', mail.reward.gems ? `보석 ${mail.reward.gems}` : ''].filter(Boolean).join(' · '); return <button key={mail.id} disabled={!unlocked || claimed} onClick={() => unlocked && !claimed && onMail(mail.id)}><span>{claimed ? '✓' : unlocked ? '!' : index + 1}</span><b>{mail.title}<small>{unlocked ? `${mail.message} · ${reward}` : '진행 조건을 달성하면 편지가 도착해요.'}</small></b><i>{claimed ? '수령 완료' : unlocked ? '받기' : '잠김'}</i></button>; })}</div>
        : isEventPanel ? <div className="lh-panel-list">{storyChapterDefinitions.map((chapter, index) => { const opened = storyOpen.has(chapter.id); const reward = chapter.rewardGems > 0 ? ` · 보상 보석 ${chapter.rewardGems}` : ''; return <button key={chapter.id} disabled><span>{opened ? '✓' : index + 1}</span><b>{chapter.title}<small>{opened ? chapter.summary : chapter.unlockHint}{reward}</small></b><i>{opened ? '열림' : '잠김'}</i></button>; })}</div>
        : isMissionPanel ? <div className="lh-panel-list">{monthlyFocusDefinitions.map((focus, index) => { const selected = state.monthlyFocus === focus.id; return <button key={focus.id} onClick={() => onMonthlyFocus(focus.id)} aria-pressed={selected}><span>{selected ? '✓' : index + 1}</span><b>{focus.label}<small>{focus.description}</small></b><i>{selected ? '선택됨' : '선택'}</i></button>; })}<button disabled><span>🔥</span><b>연속 성장<small>3개월마다 보석 3개 추가 보상</small></b><i>{state.growthStreak}개월</i></button>{monthlyMissionDefinitions.map((item, index) => { const value = state.monthlyCounters[item.counter]; const completed = state.rewardedMonthlyMissions.includes(item.id); const reward = item.reward.gold ? `${item.reward.gold}G` : `보석 ${item.reward.gems}`; return <button key={item.id} disabled><span>{completed ? '✓' : index + 1}</span><b>{item.title}<small>{Math.min(value, item.target)} / {item.target} · 보상 {reward}</small></b><i>{completed ? '보상 완료' : '진행중'}</i></button>; })}</div>
        : isBondPanel ? <div className="lh-panel-list"><button disabled><span>★</span><b>수호 등급<small>{guardian.next ? `다음 ${guardianRankDefinitions.find(item => item.id === guardian.next?.rank)?.label ?? ''}까지 ${guardian.next.threshold - guardian.points}점` : '최고 등급 달성'}</small></b><i>{guardianDefinition.label}</i></button><button disabled><span>◆</span><b>커리어 칭호<small>{titles.length ? `${titles.length}개 해금 · ${currentTitle?.description ?? ''}` : '장기 플레이 기록으로 새로운 칭호가 열려요.'}</small></b><i>{currentTitle?.label ?? '도전 중'}</i></button><button disabled><span>✦</span><b>고급 훈련 재능<small>{talentLabels.length ? talentLabels.join(' · ') : '숙련 Lv.3부터 계열별 재능이 열려요.'}</small></b><i>{talents.length} / {talentDefinitions.length}</i></button><button disabled><span>↗</span><b>커리어 기록<small>훈련 {state.careerRecords.trainings}회 · S등급 {state.careerRecords.sGrades}회 · 외출 {state.careerRecords.outings}회 · 선물 {state.careerRecords.gifts}회</small></b><i>BEST {state.careerRecords.bestScore}</i></button><button disabled><span>♥</span><b>현재 관계</b><i>{relationshipLabels[rank]}</i></button><button disabled><span>1</span><b>호감도</b><i>{state.stats.affection} / 100</i></button><button disabled><span>2</span><b>수집한 기억</b><i>{collection.memories}개</i></button><button disabled><span>3</span><b>해금한 기술</b><i>{collection.skills}개</i></button><button disabled><span>4</span><b>외출 기억</b><i>{state.visitedOutings.length} / {outingLocationIds.length}</i></button><button disabled><span>5</span><b>숨겨진 발견물</b><i>{state.discoveries.length} / {discoveryIds.length}</i></button><button disabled><span>6</span><b>최고 숙련도</b><i>Lv.{highestMastery}</i></button></div>
        : isOutingPanel ? <div className="lh-panel-list">{state.lastExploration && <button disabled><span>★</span><b>{outingDefinitions[state.lastExploration.location].name} 탐험 기록<small>{state.lastExploration.discovery ? `숨겨진 발견 · ${discoveryLabels[state.lastExploration.discovery]}` : state.lastExploration.event ? explorationEventLabels[state.lastExploration.event] : '이번에는 특별한 일 없이 평화롭게 다녀왔어요.'}</small></b><i>{state.lastExploration.discovery ? '발견!' : state.lastExploration.event ? '사건' : '기록'}</i></button>}{outingLocationIds.map((id, index) => { const location = outingDefinitions[id]; const visited = state.visitedOutings.includes(id); const xp = state.explorationXp[id]; const level = explorationLevel(xp); const nextXp = explorationXpForNextLevel(xp); return <button key={id} onClick={() => startOuting(id)}><span>{visited ? '✓' : index + 1}</span><b>{location.name}<small>탐험 Lv.{level} · {nextXp === null ? 'MAX' : `${xp} / ${nextXp} XP`} · {location.description}</small></b><i>{visited ? '탐험' : '출발'}</i></button>; })}</div>
        : isBagPanel ? <InformationPanel summaryItems={[{ label:'보유 수량', value:ownedGiftCount },{ label:'보유 종류', value:ownedGiftTypes },{ label:'전체 종류', value:giftRows.length }]} filters={[{id:'all',label:'전체',count:giftRows.length},{id:'owned',label:'보유',count:ownedGiftTypes},{id:'empty',label:'미보유',count:giftRows.length - ownedGiftTypes}]} activeFilter={bagView} onFilterChange={id => setBagView(id as BagView)} emptyMessage="해당 상태의 선물이 없어요.">{visibleGifts.length ? <div className="lh-panel-list v11-info-list">{visibleGifts.map(({ id, index, item, quantity }) => <button key={id} disabled={quantity <= 0} onClick={() => quantity > 0 && onGift(id)}><span>{index + 1}</span><b>{item.name}<small>{item.description}</small></b><i>{quantity > 0 ? `선물하기 · ${quantity}개` : '없음'}</i></button>)}</div> : null}</InformationPanel>
        : <div className="lh-panel-list">{staticPanel?.items.map((item, index) => <button key={item}><span>{index + 1}</span><b>{item}</b><i>›</i></button>)}</div>}
        </div>
      </section>
    </div>}
  </section>;
}
