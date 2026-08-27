import type { BattleSession, TacticalUnit } from './tactical-battle'
import { EQUIPMENT, type CharacterLoadout, type EquipmentEffect } from './v12-character-builds'

export type V12RuntimeUnit = TacticalUnit & { v12EquipmentEffects?: EquipmentEffect[] }

export function equippedEffects(loadout: CharacterLoadout): EquipmentEffect[] {
  const ids = Object.values(loadout.equipment).filter((id): id is NonNullable<typeof id> => Boolean(id))
  return ids.map(id => EQUIPMENT[id]?.effect).filter((effect): effect is EquipmentEffect => Boolean(effect))
}

export function applyV12LoadoutToBattle(session: BattleSession, loadout: CharacterLoadout): BattleSession {
  const effects = equippedEffects(loadout)
  if (!effects.length) return session
  const leaderId = loadout.leader
  if (!session.units.some(unit => unit.id === leaderId && unit.side === 'ally')) return session
  return {
    ...session,
    units: session.units.map(unit => unit.id === leaderId ? { ...unit, v12EquipmentEffects: effects } as V12RuntimeUnit : unit),
  }
}

export function hasHiddenExpeditionInteraction(loadout: CharacterLoadout): boolean {
  return equippedEffects(loadout).some(effect => effect.kind === 'hidden_expedition_interaction')
}
