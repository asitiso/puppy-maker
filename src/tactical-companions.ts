import type { BattlePosition, TacticalUnit } from './tactical-battle'

export type CompanionId = 'bear' | 'owl' | 'wolf' | 'cat'
export type CompanionRole = 'tank' | 'support' | 'striker' | 'trickster'

export type CompanionBondState = { xp: number; level: 1 | 2 | 3 | 4 | 5 }
export type LeaderCombatProgression = { power: number; magic: number; agility: number; maxHp: number }

export const COMPANIONS: Record<CompanionId, { name: string; role: CompanionRole; preferredPosition: BattlePosition }> = {
  bear: { name: 'Bear', role: 'tank', preferredPosition: 'front' },
  owl: { name: 'Owl', role: 'support', preferredPosition: 'back' },
  wolf: { name: 'Wolf', role: 'striker', preferredPosition: 'front' },
  cat: { name: 'Cat', role: 'trickster', preferredPosition: 'back' },
}

const thresholds = [0, 25, 75, 150, 300] as const
export function bondLevelForXp(xp: number): 1 | 2 | 3 | 4 | 5 {
  const safe = Math.max(0, Math.min(300, Math.floor(Number.isFinite(xp) ? xp : 0)))
  if (safe >= thresholds[4]) return 5
  if (safe >= thresholds[3]) return 4
  if (safe >= thresholds[2]) return 3
  if (safe >= thresholds[1]) return 2
  return 1
}

export function grantBattleBond(current: { xp: number }, amount: number): CompanionBondState {
  const xp = Math.min(300, Math.max(0, Math.floor(current.xp + Math.max(0, amount))))
  return { xp, level: bondLevelForXp(xp) }
}

export function deriveCompanionUnit(id: CompanionId, leader: LeaderCombatProgression): TacticalUnit {
  const definition = COMPANIONS[id]
  const roleScale = definition.role === 'tank' ? 1.2 : definition.role === 'striker' ? 1.08 : 0.96
  const hpScale = definition.role === 'tank' ? 1.25 : definition.role === 'support' ? 0.95 : 1
  const maxHp = Math.max(1, Math.round(leader.maxHp * 0.72 * hpScale))
  return {
    id: `companion-${id}`,
    name: definition.name,
    side: 'ally',
    position: definition.preferredPosition,
    maxHp,
    hp: maxHp,
    agility: Math.max(1, Math.round(leader.agility * (definition.role === 'trickster' ? 1.05 : 0.82))),
    power: Math.max(1, Math.round(leader.power * 0.68 * roleScale)),
    magic: Math.max(1, Math.round(leader.magic * (definition.role === 'support' ? 0.82 : 0.62))),
  }
}

export function recommendedFormation(selected: readonly CompanionId[]) {
  if (selected.length !== 2 || selected[0] === selected[1]) throw new Error('Select two distinct companions')
  return {
    runa: 'front' as BattlePosition,
    [selected[0]]: COMPANIONS[selected[0]].preferredPosition,
    [selected[1]]: COMPANIONS[selected[1]].preferredPosition,
  } as { runa: BattlePosition } & Partial<Record<CompanionId, BattlePosition>>
}

export function bondUnlocks(level: number) {
  return {
    passive: level >= 2,
    signature: level >= 3,
    teamPassive: level >= 4,
    combinationUltimate: level >= 5,
  }
}
