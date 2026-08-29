import { createPortal } from 'react-dom'
import { wardrobe } from './game/wardrobe'
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

  const editor = <section className="v12-build-editor" role="dialog" aria-modal="true" aria-labelledby="v12-build-editor-title">
    <header className="v12-build-editor__header">
      <button type="button" className="v12-build-editor__back" onClick={onClose} aria-label="편성 화면으로 돌아가기">
        <span aria-hidden="true">←</span><span>편성으로</span>
      </button>
      <div className="v12-build-editor__title"><small>BUILD EDITOR</small><h3 id="v12-build-editor-title">{title}</h3></div>
    </header>

    <div className="v12-build-editor__body">
      {locked ? <p className="v12-build-editor__locked" role="status">런 진행 중에는 편성을 변경할 수 없습니다.</p> : null}

      {mode === 'party' ? <div className="v12-build-editor__grid" role="list" aria-label="Leader 후보">
        {state.loadout.party.map(id => {
          const character = PLAYABLE_CHARACTERS[id]
          const current = state.loadout.leader === id
          return <button key={id} type="button" role="listitem" disabled={locked || current} aria-current={current ? 'true' : undefined} onClick={() => onLeaderChange(id)} className={current ? 'is-current' : ''}>
            <strong>{character.name}</strong><span>{character.role}</span><small>{current ? '현재 Leader' : `${character.resource} 자원 · Leader로 선택`}</small>
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
            <small>{!equip.allowed ? '장착 불가 · Signature 제한' : current ? '현재 장비' : equip.affinity === 'signature' ? '전용 장비 · 선택' : equip.affinity === 'preferred' ? '선호 장비 · 선택' : '공용 장비 · 선택'}</small>
          </button>
        })}
        {state.ownedEquipment.every(id => EQUIPMENT[id].slot !== mode) ? <p>보유 장비 없음</p> : null}
      </div> : null}
    </div>
  </section>

  return typeof document === 'undefined' ? editor : createPortal(editor, document.body)
}
