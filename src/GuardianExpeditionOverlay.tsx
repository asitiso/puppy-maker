import { useEffect, useMemo, useState } from 'react';
import { currentAdvancedTalents, masteryLevel, type ExpeditionActionCounts, type ExpeditionCraftingRecipeId, type ExpeditionRelicId, type ExpeditionStageId, type GameState } from './game';
import { applyExpeditionAction, finishExpeditionBattle, startExpeditionBattle, type ExpeditionActionKind, type ExpeditionBattleState } from './expedition-combat';
import { craftingRecipes } from './expedition-crafting';
import { expeditionDiscoveryDefinitions } from './expedition-discoveries';
import { expeditionRegionDefinitions, expeditionStageDefinitions, isExpeditionStageCleared, isExpeditionStageUnlocked, nextExpeditionStage } from './expedition-regions';
import { expeditionRelicDefinitions, relicModifiers } from './expedition-relics';
import { callingSignatures } from './calling-signatures';
import { guardianCallingDefinitions } from './guardian-callings';
import { callingMasteryLevel } from './calling-mastery';
import { expeditionIdentityModifiers } from './raising-expedition-effects';
import { worldResultSummary, worldUiSummary } from './world-ui';

export type GuardianExpeditionOverlayProps = {
  state: GameState;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onFinish: (stageId: ExpeditionStageId, score: number, fatigueDelta: number, stressDelta: number, actionKinds: ExpeditionActionCounts) => void;
  onEquip: (relic: ExpeditionRelicId) => void;
  onUnequip: (relic: ExpeditionRelicId) => void;
  onCraft: (recipe: ExpeditionCraftingRecipeId) => void;
};

type View = 'map' | 'battle' | 'result';

const materialLabels = { star_bark: '별빛 나무껍질', arcane_shard: '마력 파편', wind_pearl: '바람 진주' } as const;

function stageDefinition(stageId: ExpeditionStageId) {
  const stage = expeditionStageDefinitions.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown expedition stage: ${stageId}`);
  return stage;
}

function combatInput(state: GameState, stageId: ExpeditionStageId) {
  const stage = stageDefinition(stageId);
  return {
    strength: state.stats.strength,
    magic: state.stats.magic,
    calmness: state.personality.calmness,
    fatigue: state.stats.fatigue,
    condition: state.condition,
    huntMastery: masteryLevel(state.mastery.hunt.xp),
    magicMastery: masteryLevel(state.mastery.magic.xp),
    restMastery: masteryLevel(state.mastery.rest.xp),
    talents: currentAdvancedTalents(state),
    relics: relicModifiers(state.equippedExpeditionRelics),
    identity: expeditionIdentityModifiers(state.activeCalling, state.purchasedTraits),
    signatures: callingSignatures(state.activeCalling, state.purchasedTraits),
    boss: stage.boss,
  };
}

function Battle({ state, stageId, onFinish, onCancel }: {
  state: GameState;
  stageId: ExpeditionStageId;
  onFinish: (battle: ExpeditionBattleState) => void;
  onCancel: () => void;
}) {
  const stage = stageDefinition(stageId);
  const [battle, setBattle] = useState(() => startExpeditionBattle(stageId));
  const [needle, setNeedle] = useState(0.12);
  const [flash, setFlash] = useState('');
  const input = useMemo(() => combatInput(state, stageId), [state, stageId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNeedle(value => (value + 0.033) % 1), 40);
    return () => window.clearInterval(timer);
  }, []);
  const accuracy = 1 - Math.min(1, Math.abs(0.5 - needle) * 2);
  const act = (kind: ExpeditionActionKind) => {
    setBattle(current => applyExpeditionAction(current, kind, accuracy, input));
    setFlash(accuracy > 0.72 ? 'PERFECT!' : accuracy > 0.45 ? 'GOOD!' : 'MISS');
    window.setTimeout(() => setFlash(''), 450);
  };
  const calling = state.activeCalling ? guardianCallingDefinitions.find(item => item.id === state.activeCalling) : null;
  return <section className="expedition-battle">
    <header><button onClick={onCancel}>‹ 원정 지도</button><div><small>{stage.boss ? 'REGION BOSS' : 'EXPEDITION TRIAL'}</small><h2>{stage.name}</h2></div><span>목표 {stage.target}</span></header>
    {calling && <div className="expedition-calling-strip"><b>{calling.label}</b><span>전문 행동 · {calling.activity === 'hunt' ? '공격' : calling.activity === 'magic' ? '기 모으기' : calling.activity === 'rest' ? '회피' : '발견/재료 수집'}</span></div>}
    <div className="expedition-battle-stage">
      <div className="expedition-pressure"><small>PRESSURE</small><b>{stage.pressure}</b><span>회피로 원정 부담을 줄이세요.</span></div>
      <img className="expedition-runa" src="/assets/runa/runa_training_ready.png" alt="훈련 준비 중인 루나" />
      <div className="expedition-score"><small>SCORE</small><strong>{battle.score}</strong><span>공격 {battle.actionKinds.attack} · 회피 {battle.actionKinds.dodge} · 기 {battle.actionKinds.charge}</span></div>
      <div className="expedition-timing"><i className="sweet"/><em style={{ transform: `rotate(${needle * 360}deg)` }}/>{flash && <img src="/assets/effects/success_burst.png" alt=""/>}<b>{flash}</b></div>
    </div>
    <div className="expedition-actions">
      <button onClick={() => act('attack')}><b>공격</b><span>근력 · 사냥 숙련</span></button>
      <button onClick={() => act('dodge')}><b>회피</b><span>침착함 · 휴식 숙련</span></button>
      <button onClick={() => act('charge')}><b>기 모으기</b><span>마력 · 마법 숙련</span></button>
    </div>
    <button className="expedition-finish" disabled={battle.actionCount < 3} onClick={() => onFinish(battle)}>원정 결과 확인</button>
  </section>;
}

export default function GuardianExpeditionOverlay({ state, open, onOpen, onClose, onFinish, onEquip, onUnequip, onCraft }: GuardianExpeditionOverlayProps) {
  const [view, setView] = useState<View>('map');
  const [activeStage, setActiveStage] = useState<ExpeditionStageId>(() => nextExpeditionStage(state.expeditionRecords) ?? 'forest_path');
  const cleared = expeditionStageDefinitions.filter(stage => isExpeditionStageCleared(state.expeditionRecords[stage.id])).length;
  const bosses = ['forest_guardian', 'city_core', 'lake_tempest'].filter(id => state.rewardedExpeditionStages.includes(id as ExpeditionStageId)).length;
  const recommended = nextExpeditionStage(state.expeditionRecords);
  const world = worldUiSummary(state);

  if (!open) {
    return <button className="expedition-home-card" onClick={onOpen} aria-label={`수호자 원정 ${cleared} / 9 클리어`}>
      <img src="/ui/info_card_frame.png" alt="" draggable={false}/>
      <span><small>GUARDIAN EXPEDITION</small><strong>수호자 원정</strong><b>{cleared} / 9 · 보스 {bosses} / 3</b><em>{recommended ? `다음 · ${stageDefinition(recommended).name}` : '세 지역 정복 완료'}</em></span>
    </button>;
  }

  const finishBattle = (battle: ExpeditionBattleState) => {
    const result = finishExpeditionBattle(battle);
    onFinish(result.stageId, result.score, result.fatigueDelta, result.stressDelta, result.actionKinds);
    setView('result');
  };

  if (view === 'battle') {
    return <div className="expedition-overlay"><Battle state={state} stageId={activeStage} onFinish={finishBattle} onCancel={() => setView('map')} /></div>;
  }

  if (view === 'result') {
    const result = state.lastExpeditionResult;
    const stage = stageDefinition(activeStage);
    const discovery = result?.discovery ? expeditionDiscoveryDefinitions.find(item => item.id === result.discovery) : null;
    const calling = state.activeCalling ? guardianCallingDefinitions.find(item => item.id === state.activeCalling) : null;
    const mastery = state.activeCalling ? callingMasteryLevel(state.callingMastery[state.activeCalling]) : null;
    const worldResult = worldResultSummary(state);
    return <div className="expedition-overlay"><section className="expedition-result">
      <img className="expedition-result-burst" src="/assets/effects/success_burst.png" alt=""/>
      <small>EXPEDITION RECORD</small><h2>{stage.name}</h2>
      <strong className={`expedition-grade grade-${result?.grade ?? 'C'}`}>{result?.grade ?? '...'}</strong>
      <p>{result ? `최고 기록이 원정 연대기에 저장됐어요.` : '원정 기록을 정리하고 있어요.'}</p>
      {result && <div className="expedition-result-grid">
        <span><b>첫 클리어</b>{result.firstClear ? '달성' : '재도전'}</span>
        <span><b>재료</b>+{result.materialReward}</span>
        <span><b>스토리</b>{result.storyUnlocked ? '새 장면' : '기록됨'}</span>
        <span><b>발견</b>{discovery?.label ?? '없음'}</span>
        <span><b>보스 휘장</b>{result.bossBadge ? '획득' : '-'}</span>
        <span><b>유물</b>{result.relicsUnlocked.length ? result.relicsUnlocked.length + '개' : '-'}</span>
        {calling && <span><b>Calling</b>{calling.label} · Lv.{mastery}</span>}
      </div>}
      {worldResult && <div className="expedition-world-result">
        <small>WORLD PROGRESS</small>
        <div><b>{worldResult.regionLabel} 명성</b><span>{worldResult.renownLabel}</span></div>
        <div><b>계절 원정</b><span>{worldResult.seasonLabel}</span></div>
        {worldResult.eventMaterialLabel && <div><b>월드 이벤트</b><span>{worldResult.eventMaterialLabel}</span></div>}
        {worldResult.seasonRewardLabel && <div><b>시즌 보상</b><span>{worldResult.seasonRewardLabel}</span></div>}
        {worldResult.contractLabel && <div><b>월간 의뢰</b><span>{worldResult.contractLabel}</span></div>}
      </div>}
      <button onClick={() => setView('map')}>원정 지도로 돌아가기</button>
    </section></div>;
  }

  return <div className="expedition-overlay"><section className="expedition-map">
    <header><button onClick={onClose}>‹ 홈</button><div><small>GUARDIAN EXPEDITION</small><h1>수호자 원정</h1></div><span>{cleared}/9 · 보스 {bosses}/3</span></header>
    <div className="expedition-world-event"><b>{world.expeditionMap.eventStrip}</b><span>{world.event.bonusLabel}</span></div>
    <div className="expedition-materials">{Object.entries(state.expeditionMaterials).map(([id, value]) => <span key={id}><b>{materialLabels[id as keyof typeof materialLabels]}</b>{value}</span>)}</div>
    <div className="expedition-regions">{expeditionRegionDefinitions.map(region => <article key={region.id} className={region.id === world.expeditionMap.featuredRegionId ? 'event-featured' : ''}>
      <h3>{region.name}<small>{world.expeditionMap.regionRenownLabels[region.id]} · {region.stages.filter(id => isExpeditionStageCleared(state.expeditionRecords[id])).length}/3</small></h3>
      {region.stages.map((stageId, index) => {
        const stage = stageDefinition(stageId);
        const record = state.expeditionRecords[stageId];
        const unlocked = isExpeditionStageUnlocked(stageId, state.expeditionRecords);
        return <button key={stageId} disabled={!unlocked} className={stageId === recommended ? 'recommended' : ''} onClick={() => { setActiveStage(stageId); setView('battle'); }}>
          <span>{record.cleared ? record.bestGrade : unlocked ? index + 1 : '🔒'}</span><b>{stage.name}<small>{stage.boss ? 'BOSS · ' : ''}목표 {stage.target}{record.bestScore ? ` · BEST ${record.bestScore}` : ''}</small></b><i>{record.cleared ? '재도전' : unlocked ? '출발' : '잠김'}</i>
        </button>;
      })}
    </article>)}</div>
    <div className="expedition-meta-panels">
      <article><h3>원정 유물 <small>{state.equippedExpeditionRelics.length}/3 장착</small></h3>{expeditionRelicDefinitions.map(relic => {
        const owned = state.ownedExpeditionRelics.includes(relic.id);
        const equipped = state.equippedExpeditionRelics.includes(relic.id);
        return <button key={relic.id} disabled={!owned} onClick={() => equipped ? onUnequip(relic.id) : onEquip(relic.id)}><b>{owned ? relic.label : '미발견 유물'}<small>{relic.description}</small></b><i>{equipped ? '해제' : owned ? '장착' : '잠김'}</i></button>;
      })}</article>
      <article><h3>원정 제작소</h3>{craftingRecipes.map(recipe => <button key={recipe.id} onClick={() => onCraft(recipe.id)}><b>{recipe.label}<small>{Object.entries(recipe.costs).map(([id, value]) => `${materialLabels[id as keyof typeof materialLabels]} ${value}`).join(' · ')}</small></b><i>제작</i></button>)}</article>
    </div>
    <footer><span>스토리 {state.expeditionStoryEntries.length}/9</span><span>발견 {state.expeditionDiscoveries.length}/9</span><span>유물 {state.ownedExpeditionRelics.length}/6</span></footer>
  </section></div>;
}
