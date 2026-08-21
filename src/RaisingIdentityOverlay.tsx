import { useEffect, useMemo, useRef, useState } from 'react';
import { giftDefinitions } from './adventure';
import { bondSceneDefinitions } from './bond-scenes';
import { callingMasteryLevel } from './calling-mastery';
import { callingSignatureDefinitions, callingSignatures } from './calling-signatures';
import { currentGuardianStatus, type GameState, type GuardianCallingId, type GrowthTraitId } from './game';
import { activities } from './game-core';
import { canPurchaseGrowthTrait, growthTraitDefinitions } from './growth-traits';
import { callingSwitchKey, guardianCallingDefinitions } from './guardian-callings';
import { guardianRankDefinitions } from './guardian-rank';
import { personalityArchetype, runaPreferences } from './runa-personality';

export type RaisingIdentityOverlayProps = {
  state: GameState;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCalling: (calling: GuardianCallingId) => void;
  onTrait: (trait: GrowthTraitId) => void;
};

const archetypeLabels = {
  brave:'용감한 루나', gentle:'다정한 루나', curious:'호기심 많은 루나', serene:'차분한 루나', balanced:'균형 잡힌 루나',
} as const;

const rankOrder = ['trainee','junior','guardian','veteran','starlight'] as const;

export default function RaisingIdentityOverlay({ state, open, onOpen, onClose, onCalling, onTrait }: RaisingIdentityOverlayProps) {
  const [tab, setTab] = useState<'calling'|'traits'|'bond'>('calling');
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  const guardian = currentGuardianStatus(state);
  const rankReady = rankOrder.indexOf(guardian.rank) >= rankOrder.indexOf('guardian');
  const archetype = personalityArchetype(state.personality);
  const preferences = runaPreferences(archetype, state.activeCalling);
  const activeDefinition = guardianCallingDefinitions.find(item => item.id === state.activeCalling) ?? null;
  const signatureIds = useMemo(() => callingSignatures(state.activeCalling, state.purchasedTraits), [state.activeCalling, state.purchasedTraits]);
  const signatures = signatureIds.map(id => callingSignatureDefinitions.find(item => item.id === id)).filter(Boolean);
  const switchLocked = state.callingLastSwitchKey === callingSwitchKey(state.year, state.month);
  const canSwitch = rankReady && !switchLocked;

  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return <button ref={launcherRef} className="raising-home-card" onClick={onOpen} aria-label="루나 성장 정체성 열기">
      <img src="/ui/info_card_frame.png" alt="" draggable={false}/>
      <span><small>RUNA IDENTITY</small><strong>{activeDefinition?.label ?? archetypeLabels[archetype]}</strong><b>성장 포인트 {state.growthPoints} · 장면 {state.unlockedBondScenes.length}/10</b><em>{activeDefinition ? `Calling Lv.${callingMasteryLevel(state.callingMastery[activeDefinition.id])}` : rankReady ? '수호자의 길을 선택할 수 있어요' : '정식 수호자부터 Calling 해금'}</em></span>
    </button>;
  }

  return <div className="raising-overlay">
    <section className="raising-panel" role="dialog" aria-modal="true" aria-label="루나 성장 정체성">
      <img className="raising-panel-frame" src="/ui/popup_panel_frame.png" alt="" draggable={false}/>
      <div className="raising-content">
        <header>
          <button autoFocus onClick={onClose}>‹ 홈</button>
          <div><small>RUNA RAISING IDENTITY</small><h1>루나의 성장 방향</h1></div>
          <span><b>{state.growthPoints}</b> GROWTH PT</span>
        </header>

        <div className="raising-summary">
          <img src="/assets/runa/runa_talk.png" alt="루나"/>
          <div><small>PERSONALITY</small><strong>{archetypeLabels[archetype]}</strong><p>{activeDefinition?.label ?? '아직 Calling 미선택'} · {guardianRankDefinitions.find(item => item.id === guardian.rank)?.label}</p><p>좋아하는 활동 <b>{activities[preferences.favoriteActivity].name}</b> · 좋아하는 선물 <b>{giftDefinitions[preferences.favoriteGift].name}</b></p></div>
          <div className="raising-signatures"><small>SIGNATURE</small>{signatures.length ? signatures.map(item => <span key={item!.id}><b>{item!.label}</b>{item!.description}</span>) : <span>Trait를 성장시키면 시그니처 능력이 열려요.</span>}</div>
        </div>

        <nav className="raising-tabs">
          <button className={tab === 'calling' ? 'active' : ''} onClick={() => setTab('calling')}>Calling</button>
          <button className={tab === 'traits' ? 'active' : ''} onClick={() => setTab('traits')}>Trait Board</button>
          <button className={tab === 'bond' ? 'active' : ''} onClick={() => setTab('bond')}>관계 장면</button>
        </nav>

        {tab === 'calling' && <div className="raising-callings">{guardianCallingDefinitions.map(definition => {
          const active = state.activeCalling === definition.id;
          const masteryXp = state.callingMastery[definition.id];
          const firstPick = state.activeCalling === null;
          const enoughGold = firstPick || state.gold >= 300;
          const enabled = !active && canSwitch && enoughGold;
          return <button key={definition.id} className={active ? 'active' : ''} disabled={!enabled} onClick={() => enabled && onCalling(definition.id)}>
            <span>{active ? '★' : guardianCallingDefinitions.indexOf(definition) + 1}</span>
            <b>{definition.label}<small>{definition.description}</small></b>
            <i>Lv.{callingMasteryLevel(masteryXp)}<small>{masteryXp} XP</small></i>
            <em>{active ? '현재 Calling' : !rankReady ? '정식 수호자 필요' : switchLocked ? '이번 달 변경 완료' : !enoughGold ? '300G 필요' : firstPick ? '무료 선택' : '300G 변경'}</em>
          </button>;
        })}</div>}

        {tab === 'traits' && <div className="raising-traits">{guardianCallingDefinitions.map(calling => <article key={calling.id} className={state.activeCalling === calling.id ? 'active-calling' : ''}>
          <h3>{calling.label}<small>{state.activeCalling === calling.id ? '효과 활성' : '보유 가능 · 효과 비활성'}</small></h3>
          {growthTraitDefinitions.filter(item => item.calling === calling.id).map(trait => {
            const owned = state.purchasedTraits.includes(trait.id);
            const available = canPurchaseGrowthTrait(trait.id, state.purchasedTraits, state.growthPoints);
            return <button key={trait.id} className={owned ? 'owned' : ''} disabled={!available} onClick={() => available && onTrait(trait.id)}>
              <span>T{trait.tier}</span><b>{trait.label}<small>{trait.description}</small></b><i>{owned ? '획득' : `${trait.cost} PT`}</i>
            </button>;
          })}
        </article>)}</div>}

        {tab === 'bond' && <div className="raising-bonds">{bondSceneDefinitions.map((scene, index) => {
          const unlocked = state.unlockedBondScenes.includes(scene.id);
          const reward = scene.reward.gems ? `보석 ${scene.reward.gems}` : `${scene.reward.gold}G`;
          return <article key={scene.id} className={unlocked ? 'unlocked' : ''}>
            <span>{unlocked ? '♥' : index + 1}</span><b>{unlocked ? scene.title : '잠긴 관계 장면'}<small>{unlocked ? scene.summary : '함께 성장하며 조건을 달성하면 열려요.'}</small></b><i>{unlocked ? `${reward} 획득` : '미해금'}</i>
          </article>;
        })}</div>}
      </div>
    </section>
  </div>;
}
