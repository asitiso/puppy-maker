import type { BattlePosition, TacticalUnit } from './tactical-battle'

export type CompanionId = 'bear' | 'owl' | 'wolf' | 'cat'
export type CompanionRole = 'tank' | 'support' | 'striker' | 'trickster'
export type CompanionBondState = { xp: number; level: 1 | 2 | 3 | 4 | 5 }
export type LeaderCombatProgression = { power: number; magic: number; agility: number; maxHp: number }
export type DerivedCompanionUnit = TacticalUnit & { name: string; role: CompanionRole; power: number; magic: number; attackPower:number; skillPower:number; supportPower:number }

export const COMPANIONS: Record<CompanionId, { name: string; role: CompanionRole; preferredPosition: BattlePosition }> = {
  bear: { name: 'Bear', role: 'tank', preferredPosition: 'front' }, owl: { name: 'Owl', role: 'support', preferredPosition: 'back' },
  wolf: { name: 'Wolf', role: 'striker', preferredPosition: 'front' }, cat: { name: 'Cat', role: 'trickster', preferredPosition: 'back' },
}

export function bondLevelForXp(xp: number): 1 | 2 | 3 | 4 | 5 {
  const safe = Math.max(0, Math.min(300, Math.floor(Number.isFinite(xp) ? xp : 0)))
  if (safe >= 300) return 5; if (safe >= 150) return 4; if (safe >= 75) return 3; if (safe >= 25) return 2; return 1
}
export function grantBattleBond(current: { xp: number }, amount: number): CompanionBondState {
  const baseXp = Math.max(0, Math.min(300, Math.floor(Number.isFinite(current.xp) ? current.xp : 0)))
  const gain = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const xp = Math.min(300, baseXp + gain)
  return { xp, level: bondLevelForXp(xp) }
}
export function deriveCompanionUnit(id: CompanionId, leader: LeaderCombatProgression): DerivedCompanionUnit {
  const d = COMPANIONS[id], roleScale = d.role === 'tank' ? 1 : d.role === 'striker' ? 1.2 : 0.96
  const maxHp = Math.max(1, Math.round(leader.maxHp * 0.72 * (d.role === 'tank' ? 1.25 : d.role === 'support' ? 0.95 : 1)))
  const power = Math.max(1,Math.round(leader.power*0.68*roleScale))
  const magic = Math.max(1,Math.round(leader.magic*(d.role==='support'?0.82:0.62)))
  const skillPower = d.role==='support' ? magic : d.role==='striker' ? Math.max(power,magic) : Math.max(1,Math.round((power+magic)/2))
  const supportPower = d.role==='support' ? magic : Math.max(1,Math.round(magic*.65))
  return { id:`companion-${id}`, name:d.name, role:d.role, side:'ally', position:d.preferredPosition, maxHp, hp:maxHp,
    agility:Math.max(1,Math.round(leader.agility*(d.role==='trickster'?1.05:0.82))), ap:3,maxAp:3,mp:0,maxMp:10,shield:0,
    power,magic,attackPower:power,skillPower,supportPower }
}
export function recommendedFormation(selected: readonly CompanionId[]) {
  if (selected.length !== 2 || selected[0] === selected[1]) throw new Error('Select two distinct companions')
  return { runa:'front' as BattlePosition, [selected[0]]:COMPANIONS[selected[0]].preferredPosition, [selected[1]]:COMPANIONS[selected[1]].preferredPosition } as {runa:BattlePosition}&Partial<Record<CompanionId,BattlePosition>>
}
export function bondUnlocks(level:number){ return { passive:level>=2, signature:level>=3, teamPassive:level>=4, combinationUltimate:level>=5 } }
