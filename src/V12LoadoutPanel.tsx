import {
  EQUIPMENT,
  PLAYABLE_CHARACTERS,
  canEquip,
  type CharacterBuildState,
  type EquipmentId,
  type EquipmentSlot,
} from './v12-character-builds'

export type V12LoadoutPanelProps = {
  state: CharacterBuildState
  onStartRun: () => void
  onEditParty?: () => void
  onEditOutfit?: () => void
  onEditEquipment?: (slot: EquipmentSlot) => void
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

export default function V12LoadoutPanel({
  state,
  onStartRun,
  onEditParty,
  onEditOutfit,
  onEditEquipment,
}: V12LoadoutPanelProps) {
  const locked = Boolean(state.runLoadoutSnapshot)
  const leader = state.loadout.leader
  const leaderDefinition = PLAYABLE_CHARACTERS[leader]

  return (
    <section className="v12-loadout" aria-labelledby="v12-loadout-title">
      <header className="v12-loadout__header">
        <div>
          <p className="v12-loadout__eyebrow">CHARACTER BUILD</p>
          <h2 id="v12-loadout-title">파티 &amp; 로드아웃</h2>
        </div>
        <span className={`v12-loadout__lock ${locked ? 'is-locked' : ''}`} role="status">
          {locked ? '런 진행 중 · 편성 잠금' : '출발 전 자유 편성'}
        </span>
      </header>

      <section className="v12-loadout__section" aria-labelledby="v12-party-title">
        <div className="v12-loadout__section-heading">
          <div>
            <p className="v12-loadout__step">1</p>
            <h3 id="v12-party-title">파티 편성</h3>
          </div>
          <button type="button" onClick={onEditParty} disabled={locked || !onEditParty} aria-disabled={locked || !onEditParty}>
            {locked ? '런 종료 후 변경 가능' : onEditParty ? '편성 변경' : '현재 편성'}
          </button>
        </div>
        <div className="v12-loadout__party" role="list" aria-label="현재 파티">
          {state.loadout.party.map((id) => {
            const character = PLAYABLE_CHARACTERS[id]
            const isLeader = id === leader
            return (
              <article className={`v12-loadout__member ${isLeader ? 'is-leader' : ''}`} role="listitem" key={id}>
                <span className="v12-loadout__member-name">{character.name}</span>
                <span>{character.role}</span>
                <span>{character.resource}</span>
                {isLeader ? <strong>Leader</strong> : null}
              </article>
            )
          })}
        </div>
        <p className="v12-loadout__hint">
          현재 조작 중심: <strong>{leaderDefinition.name}</strong> · 전투 중 조건 충족 시 Leader 전환
        </p>
      </section>

      <section className="v12-loadout__section" aria-labelledby="v12-style-title">
        <div className="v12-loadout__section-heading">
          <div>
            <p className="v12-loadout__step">2</p>
            <h3 id="v12-style-title">의상</h3>
          </div>
          <button type="button" onClick={onEditOutfit} disabled={locked || !onEditOutfit} aria-disabled={locked || !onEditOutfit}>
            {locked ? '런 종료 후 변경 가능' : onEditOutfit ? '의상 변경' : '현재 의상'}
          </button>
        </div>
        <div className="v12-loadout__outfit">
          <strong>{state.loadout.outfitId}</strong>
          <span>외형은 자유롭게 · 효과는 작고 선택적인 시너지</span>
        </div>
      </section>

      <section className="v12-loadout__section" aria-labelledby="v12-equipment-title">
        <div className="v12-loadout__section-heading">
          <div>
            <p className="v12-loadout__step">3</p>
            <h3 id="v12-equipment-title">장비</h3>
          </div>
        </div>
        <div className="v12-loadout__equipment">
          {(Object.keys(SLOT_LABEL) as EquipmentSlot[]).map((slot) => {
            const itemId = state.loadout.equipment[slot]
            const item = itemId ? EQUIPMENT[itemId] : null
            const affinity = item ? canEquip(leader, item).affinity : null
            const editable = Boolean(onEditEquipment) && !locked
            return (
              <button
                type="button"
                className="v12-loadout__slot"
                key={slot}
                onClick={() => onEditEquipment?.(slot)}
                disabled={!editable}
                aria-disabled={!editable}
              >
                <span className="v12-loadout__slot-label">{SLOT_LABEL[slot]}</span>
                {item ? (
                  <>
                    <strong>{item.name}</strong>
                    <span>{equipmentIdentity(item.id)}</span>
                    <small>{affinity === 'signature' ? '전용 장비' : affinity === 'preferred' ? '선호 장비' : '공용 장비'}</small>
                  </>
                ) : (
                  <>
                    <strong>비어 있음</strong>
                    <span>{editable ? '장비를 선택하세요' : '장비 설정 없음'}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <footer className="v12-loadout__footer">
        <p>{locked ? '현재 런은 출발 시점의 로드아웃을 사용합니다.' : '편성을 확인하면 이 조합으로 런이 잠깁니다.'}</p>
        <button
          type="button"
          className="v12-loadout__primary"
          data-v12-primary-action="true"
          onClick={onStartRun}
          disabled={locked}
          aria-disabled={locked}
        >
          {locked ? '런 진행 중' : '원정 시작'}
        </button>
      </footer>
    </section>
  )
}
