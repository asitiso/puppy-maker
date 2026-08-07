import { useState } from 'react';
import {
  achievementDefinitions,
  collectionProgress,
  eligibleAchievements,
  masteryLevel,
  relationshipRank,
  type AchievementId,
  type GameState,
} from './game';
import { getHomePanel, type HomeMenuId } from './home-panels';

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

const conditionLabels: Record<GameState['condition'], string> = {
  energetic: '활기참', normal: '평범함', focused: '집중됨', tired: '피곤함',
};

const recommendations: Record<GameState['condition'], string> = {
  energetic: '몸이 가벼워요. 사냥 훈련에 잘 맞는 날이에요.',
  normal: '오늘은 원하는 훈련을 골라도 좋아요.',
  focused: '집중력이 좋아요. 마법 수업을 해볼까요?',
  tired: '오늘은 휴식을 넣어보는 게 좋아요.',
};

const relationshipLabels = {
  acquaintance: '낯선 사이', familiar: '익숙한 사이', friend: '친구', close_friend: '가까운 친구', precious: '소중한 사람',
} as const;

type LayeredHomeProps = {
  state: GameState;
  onSchedule: () => void;
  onClaimAchievement: (achievement: AchievementId) => void;
};

export default function LayeredHome({ state, onSchedule, onClaimAchievement }: LayeredHomeProps) {
  const [petted, setPetted] = useState(false);
  const [activeNav, setActiveNav] = useState(2);
  const [activePanel, setActivePanel] = useState<HomeMenuId | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const staticPanel = activePanel ? getHomePanel(activePanel) : null;
  const stamina = Math.max(0, 100 - state.stats.fatigue);
  const rank = relationshipRank(state.stats.affection);
  const collection = collectionProgress(state);
  const eligible = new Set(eligibleAchievements(state));
  const highestMastery = Math.max(...Object.values(state.mastery).map(entry => masteryLevel(entry.xp)));
  const isQuestPanel = activePanel === 'quest';
  const isBondPanel = activePanel === 'bond';
  const hasPanel = Boolean(staticPanel || isQuestPanel || isBondPanel);
  const panelTitle = isQuestPanel ? '성장 업적' : isBondPanel ? '루나와의 교감' : staticPanel?.title ?? '';
  const panelEyebrow = isQuestPanel ? 'ACHIEVEMENTS' : isBondPanel ? 'BOND & COLLECTION' : staticPanel?.eyebrow ?? '';

  const handleMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 });
  };

  const openMenu = (id: HomeMenuId, index?: number) => {
    if (typeof index === 'number') setActiveNav(index);
    if (id === 'schedule') return onSchedule();
    if (id === 'bond') {
      setPetted(true);
      setActivePanel('bond');
      return;
    }
    setActivePanel(id);
  };

  return <section
    className="layered-home"
    onPointerMove={handleMove}
    onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    style={{ '--px': tilt.x, '--py': tilt.y } as React.CSSProperties}
  >
    <div className="lh-scene-layer">
      <img className="lh-background" src="/assets/home/home_bg_layer.webp" alt="" />
      <div className="lh-window-light" /><div className="lh-fire-light" /><div className="lh-floor-glow" />
    </div>
    <div className="layered-vignette" /><div className="layered-particles" />

    <button className="lh-character" onClick={() => setPetted(true)} aria-label="루나와 교감">
      <span className="lh-character-rim" /><img src={petted ? '/assets/runa/runa_talk.png' : '/assets/home/runa_idle_layer.png'} alt="수호 여우 루나" />
    </button>
    {petted && <img className="lh-heart" src="/assets/effects/affection_hearts.png" alt="" />}

    <div className="lh-level"><Frame src="/ui/level_badge_frame.png" /><div><small>Lv.</small><strong>10</strong><span>루나</span></div></div>
    <div className="lh-currency"><Frame src="/ui/currency_hud_frame.png" /><div className="lh-currency-values"><span><i className="coin gold">●</i><b>{state.gold.toLocaleString()}</b></span><span><i className="coin gem">◆</i><b>{state.gems.toLocaleString()}</b></span></div><div className="lh-hp"><Frame src="/ui/stamina_hud_frame.png" /><i style={{ width: `${stamina}%` }} /><b>{stamina} / 100</b></div></div>
    <div className="lh-weather"><Frame src="/ui/info_card_frame.png" /><div><b>{state.month}월 {state.week}주차</b><span>☀ 맑음</span></div></div>

    <div className="lh-shortcuts">{shortcuts.map(([icon, label, id]) => <button key={id} onClick={() => openMenu(id)}><Frame src="/ui/home_shortcut_button_frame.png" /><span className="lh-shortcut-icon"><GameIcon name={icon} /></span><b>{label}</b></button>)}</div>
    <div className="lh-goal"><Frame src="/ui/weekly_goal_panel_frame.png" /><div><h3>성장 컬렉션</h3><p>기억 <b>{collection.memories}개</b></p><p>기술 <b>{collection.skills}개</b></p><p>숙련 Lv.4+ <b>{collection.masteredActivities}개</b></p></div></div>
    <div className="lh-promos"><button onClick={() => openMenu('event')}><span><GameIcon name="gems" /></span><b>초보자 패키지</b><small>23:59:59</small></button><button onClick={() => openMenu('quest')}><span><GameIcon name="paw" /></span><b>성장 업적</b><small>{eligibleAchievements(state).filter(id => !state.claimedAchievements.includes(id)).length}개 수령 가능</small></button></div>

    <div className="lh-dialogue"><Frame src="/ui/dialogue_panel_frame.png" /><span className="lh-name">루나</span><p>{petted ? '헤헤… 주인님의 손은 정말 따뜻해요!' : `관계 · ${relationshipLabels[rank]} · 컨디션 ${conditionLabels[state.condition]}`}<br/>{petted ? `우리 사이는 지금 '${relationshipLabels[rank]}'예요.` : recommendations[state.condition]}</p><i className="lh-dialogue-next">◆</i></div>

    <nav className="lh-bottom-nav">{nav.map(([icon, label, id], index) => <button key={id} className={activeNav === index ? 'is-active' : ''} onClick={() => openMenu(id, index)} aria-pressed={activeNav === index}><Frame src={activeNav === index ? '/ui/bottom_nav_button_active_frame.png' : '/ui/bottom_nav_button_frame.png'} /><span><GameIcon name={icon} /></span><b>{label}</b></button>)}</nav>

    {activePanel && hasPanel && <div className="lh-panel-backdrop" onClick={() => setActivePanel(null)}>
      <section className="lh-panel" role="dialog" aria-modal="true" aria-label={panelTitle} onClick={event => event.stopPropagation()}>
        <button className="lh-panel-close" onClick={() => setActivePanel(null)} aria-label="닫기">×</button>
        <small>{panelEyebrow}</small><h2>{panelTitle}</h2>
        {isQuestPanel ? <div className="lh-panel-list">{achievementDefinitions.map((item, index) => {
          const claimed = state.claimedAchievements.includes(item.id);
          const canClaim = eligible.has(item.id) && !claimed;
          const reward = item.reward.gold ? `${item.reward.gold}G` : `보석 ${item.reward.gems}`;
          return <button key={item.id} disabled={!canClaim} onClick={() => canClaim && onClaimAchievement(item.id)}>
            <span>{claimed ? '✓' : canClaim ? '!' : index + 1}</span>
            <b>{item.title}<small>{item.description} · {reward}</small></b>
            <i>{claimed ? '완료' : canClaim ? '받기' : '진행중'}</i>
          </button>;
        })}</div> : isBondPanel ? <div className="lh-panel-list">
          <button disabled><span>♥</span><b>현재 관계</b><i>{relationshipLabels[rank]}</i></button>
          <button disabled><span>1</span><b>호감도</b><i>{state.stats.affection} / 100</i></button>
          <button disabled><span>2</span><b>수집한 기억</b><i>{collection.memories}개</i></button>
          <button disabled><span>3</span><b>해금한 기술</b><i>{collection.skills}개</i></button>
          <button disabled><span>4</span><b>최고 숙련도</b><i>Lv.{highestMastery}</i></button>
        </div> : <div className="lh-panel-list">{staticPanel?.items.map((item, index) => <button key={item}><span>{index + 1}</span><b>{item}</b><i>›</i></button>)}</div>}
      </section>
    </div>}
  </section>;
}
