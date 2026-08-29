import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { wardrobe } from './game/wardrobe'
import V14OverlayBackButton from './V14OverlayBackButton'
import { useOverlayFocusManagement } from './useOverlayFocusManagement'
import {
  EQUIPMENT,
  PLAYABLE_CHARACTERS,
  canEquip,
  type CharacterBuildState,
  type EquipmentId,
  type EquipmentSlot,
  type PlayableCharacterId,
} from './v12-character-builds'
import './v12-build-editor.css'

export type V12BuildEditorMode = 'party' | 'outfit' | EquipmentSlot

export type V12BuildEditorProps = {
  mode: V12BuildEditorMode
  state: CharacterBuildState
  unlockedOutfitIds: readonly string[]
  onLeaderChange: (leader: PlayableCharacterId) => void
  onOutfitChange: (outfitId: string) => void
  onEquipmentChange: (equipmentId: EquipmentId) => void
  onClose: () => void
}

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: '무기',
  defenseSupport: '방어 / 지원',
  accessory: '액세서리',
}

function equipmentIdentity(id: EquipmentId): string {
  switch (EQUIPMENT[id].effect.kind) {
    case 'chain_magic': return '연쇄 마법'
    case 'ally_intercept_counter': return '아군 보호 · 반격'
    case 'hidden_expedition_interaction': return '숨은 원정 상호작용'
    case 'coop_attack_boost': return '협동 공격 강화'
    default: return '기본 공격 훈련'
  }
}

function equipmentEffectDetail(id: EquipmentId): string {
  const effect = EQUIPMENT[id].effect
  switch (effect.kind) {
    case 'chain_magic': return `연쇄 대상 ${effect.chainTargets}명`
    case 'ally_intercept_counter': return `피해 ${Math.round(effect.interceptRatio * 100)}% 대신 받고 반격`
    case 'hidden_expedition_interaction': return '원정의 숨은 상호작용 발견'
    case 'coop_attack_boost': return `협동 공격 +${Math.round(effect.bonusRatio * 100)}%`
    default: return '기본 공격 운용에 적합'
  }
}

function equipmentCompatibilityWarning(state: CharacterBuildState, leader: PlayableCharacterId): string | null {
  const removed = Object.values(state.loadout.equipment)
    .filter((id): id is EquipmentId => Boolean(id))
    .filter(id => !canEquip(leader, EQUIPMENT[id]).allowed)
    .map(id => EQUIPMENT[id].name)
  return removed.length ? `${removed.join(' · ')} 해제 예정` : null
}

export default function V12BuildEditor({
  mode,
  state,
  unlockedOutfitIds,
  onLeaderChange,
  onOutfitChange,
  onEquipmentChange,
  onClose,
}: V12BuildEditorProps) {
  const locked = Boolean(state.runLoadoutSnapshot)
  const title = mode === 'party' ? 'Leader 선택' : mode === 'outfit' ? '의상 선택' : `${SLOT_LABEL[mode]} 선택`
  const dialogRef = useRef<HTMLElement>(null)
  const initialFocusRef = useRef<HTMLButtonElement>(null)
  const currentLeader = PLAYABLE_CHARACTERS[state.loadout.leader]
  const currentOutfit = wardrobe.find(item => item.id === state.loadout.outfitId)
  const currentEquipment = (Object.keys(SLOT_LABEL) as EquipmentSlot[]).map(slot => {
    const id = state.loadout.equipment[slot]
    return `${SLOT_LABEL[slot]} ${id ? EQUIPMENT[id].name : '없음'}`
  }).join(' · ')
  useOverlayFocusManagement({ open: true, onClose, dialogRef, initialFocusRef })

  const editor = <section ref={dialogRef} className="v12-build-editor" role="dialog" aria-modal="true" aria-labelledby="v12-build-editor-title">
    <header className="v12-build-editor__header">
      <V14OverlayBackButton
        buttonRef={initialFocusRef}
        className="v12-build-editor__back"
        onClick={onClose}
        label="편성으로"
        ariaLabel="편성 화면으로 돌아가기"
      />
      <div className="v12-build-editor__title"><small>BUILD EDITOR</small><h3 id="v12-build-editor-title">{title}</h3></div>
    </header>

    <div className="v12-build-editor__body">
      {locked ? <p className="v12-build-editor__locked" role="status">런 진행 중에는 편성을 변경할 수 없습니다.</p> : null}
      <div className="v12-build-editor__current" aria-label="현재 편성">
        <strong>현재 편성</strong>
        <span>현재 Leader · {currentLeader.name}</span>
        <span>현재 의상 · {currentOutfit?.name ?? state.loadout.outfitId}</span>
        <span>현재 장비 · {currentEquipment}</span>
      </div>

      {mode === 'party' ? <div className="v12-build-editor__grid" role="list" aria-label="Leader 후보">
        {state.loadout.party.map(id => {
          const character = PLAYABLE_CHARACTERS[id]
          const current = state.loadout.leader === id
          const compatibilityWarning = current ? null : equipmentCompatibilityWarning(state, id)
          return <button key={id} type="button" role="listitem" disabled={locked || current} aria-current={current ? 'true' : undefined} onClick={() => onLeaderChange(id)} className={current ? 'is-current' : ''}>
            <strong>{character.name}</strong><span>{character.role}</span><small>{current ? '현재 Leader' : `${character.resource} 자원 · Leader로 선택`}</small>
            {compatibilityWarning ? <em className="v12-build-editor__warning">⚠ {compatibilityWarning}</em> : null}
          </button>
        })}
      </div> : null}

      {mode === 'outfit' ? <div className="v12-build-editor__grid" role="list" aria-label="해금 의상">
        {wardrobe.filter(item => unlockedOutfitIds.includes(item.id)).map(item => {
          const current = state.loadout.outfitId === item.id
          return <button key={item.id} type="button" role="listitem" disabled={locked || current} aria-current={current ? 'true' : undefined} onClick={() => onOutfitChange(item.id)} className={current ? 'is-current' : ''}>
            <strong>{item.name}</strong><span>{item.description}</span><small>{current ? '현재 의상' : '선택'}</small>
          </button>
        })}
      </div> : null}

      {mode !== 'party' && mode !== 'outfit' ? <div className="v12-build-editor__grid" role="list" aria-label={`${SLOT_LABEL[mode]} 보유 장비`}>
        {state.ownedEquipment.filter(id => EQUIPMENT[id].slot === mode).map(id => {
          const item = EQUIPMENT[id]
          const equip = canEquip(state.loadout.leader, item)
          const current = state.loadout.equipment[mode] === id
          const disabled = locked || current || !equip.allowed
          return <button key={id} type="button" role="listitem" disabled={disabled} aria-current={current ? 'true' : undefined} onClick={() => onEquipmentChange(id)} className={current ? 'is-current' : ''}>
            <strong>{item.name}</strong><span>{equipmentIdentity(id)}</span>
            <em className="v12-build-editor__effect">{equipmentEffectDetail(id)}</em>
            <small>{!equip.allowed ? '장착 불가 · Signature 제한' : current ? '현재 장비' : equip.affinity === 'signature' ? '전용 장비 · 선택' : equip.affinity === 'preferred' ? '선호 장비 · 선택' : '공용 장비 · 선택'}</small>
          </button>
        })}
        {state.ownedEquipment.every(id => EQUIPMENT[id].slot !== mode) ? <p>보유 장비 없음</p> : null}
      </div> : null}
    </div>
  </section>

  return typeof document === 'undefined' ? editor : createPortal(editor, document.body)
}
