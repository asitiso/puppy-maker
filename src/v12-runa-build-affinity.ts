import type { GuardianCallingId } from './guardian-callings'
import type { RunaPersonalityArchetype } from './runa-personality'
import { EQUIPMENT, canEquip, type EquipmentId } from './v12-character-builds'

type BuildTag = 'calling' | 'personality' | 'shared'

const callingEquipment: Record<GuardianCallingId, readonly EquipmentId[]> = {
  vanguard: ['training_blade'],
  arcanist: ['star_staff'],
  caretaker: ['bond_brooch'],
  pathfinder: ['explorer_compass'],
}

const personalityEquipment: Record<RunaPersonalityArchetype, readonly EquipmentId[]> = {
  brave: ['training_blade'],
  gentle: ['bond_brooch'],
  curious: ['star_staff', 'explorer_compass'],
  serene: ['bond_brooch'],
  balanced: [],
}

export function runaBuildAffinity(
  calling: GuardianCallingId,
  personality: RunaPersonalityArchetype,
  equipmentId: EquipmentId,
): { allowed: boolean; score: number; tags: BuildTag[] } {
  const legal = canEquip('runa', EQUIPMENT[equipmentId]).allowed
  if (!legal) return { allowed: false, score: 0, tags: [] }
  const tags: BuildTag[] = ['shared']
  let score = 1
  if (callingEquipment[calling].includes(equipmentId)) {
    score += 2
    tags.push('calling')
  }
  if (personalityEquipment[personality].includes(equipmentId)) {
    score += 1
    tags.push('personality')
  }
  return { allowed: true, score, tags }
}
