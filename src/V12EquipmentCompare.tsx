import {
  EQUIPMENT,
  PLAYABLE_CHARACTERS,
  canEquip,
  type EquipmentId,
  type PlayableCharacterId,
} from './v12-character-builds'

function identity(id: EquipmentId): string {
  switch (EQUIPMENT[id].effect.kind) {
    case 'chain_magic': return '연쇄 마법'
    case 'ally_intercept_counter': return '아군 보호 · 반격'
    case 'hidden_expedition_interaction': return '숨은 원정 상호작용'
    case 'coop_attack_boost': return '협동 공격 강화'
    default: return '기본 공격 훈련'
  }
}

function affinityLabel(characterId: PlayableCharacterId, itemId: EquipmentId): string {
  const result=canEquip(characterId,EQUIPMENT[itemId])
  if(!result.allowed)return '장착 불가'
  if(result.affinity==='signature')return '전용'
  if(result.affinity==='preferred')return '선호'
  return '공용'
}

function branchLabel(branch:string):string {
  return branch.charAt(0).toUpperCase()+branch.slice(1)
}

function EquipmentCard({label,itemId,characterId}:{label:string;itemId:EquipmentId|null;characterId:PlayableCharacterId}){
  if(!itemId)return <article className="v12-equipment-compare__card"><small>{label}</small><strong>비어 있음</strong></article>
  const item=EQUIPMENT[itemId]
  const equip=canEquip(characterId,item)
  return <article className="v12-equipment-compare__card">
    <small>{label}</small>
    <strong>{item.name}</strong>
    <span>{identity(itemId)}</span>
    <em>{affinityLabel(characterId,itemId)}</em>
    {!equip.allowed&&item.signatureCharacter?<p>{PLAYABLE_CHARACTERS[item.signatureCharacter].name} 전용</p>:null}
    {item.evolutionBranches.length?<div aria-label="진화 분기">{item.evolutionBranches.map(branch=><span key={branch}>{branchLabel(branch)}</span>)}</div>:null}
  </article>
}

export default function V12EquipmentCompare({characterId,currentId,candidateId}:{characterId:PlayableCharacterId;currentId:EquipmentId|null;candidateId:EquipmentId}){
  return <section className="v12-equipment-compare" aria-label="장비 비교">
    <header><small>EQUIPMENT COMPARE</small><strong>{PLAYABLE_CHARACTERS[characterId].name} 빌드 비교</strong></header>
    <div>
      <EquipmentCard label="현재 장비" itemId={currentId} characterId={characterId}/>
      <EquipmentCard label="비교 장비" itemId={candidateId} characterId={characterId}/>
    </div>
    <p>희귀도보다 행동 변화와 파티 시너지를 먼저 비교하세요.</p>
  </section>
}
