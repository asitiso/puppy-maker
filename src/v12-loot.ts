import type { EquipmentId } from './v12-character-builds'

export type LootSource = 'battle' | 'boss' | 'hidden' | 'bond'
export type V12LootInput = { source: LootSource; key: string; owned: readonly EquipmentId[] }
export type V12LootResult = { equipmentId: EquipmentId | null; duplicate: boolean; materials: number }

const REWARDS: Partial<Record<`${LootSource}:${string}`, EquipmentId>> = {
  'battle:training': 'training_blade',
  'boss:astral': 'star_staff',
  'boss:guardian': 'guardian_shield',
  'hidden:path': 'explorer_compass',
  'bond:companion': 'bond_brooch',
}

const DUPLICATE_MATERIALS: Record<EquipmentId, number> = {
  training_blade: 1,
  star_staff: 3,
  guardian_shield: 3,
  explorer_compass: 2,
  bond_brooch: 3,
}

export function resolveV12Loot(input: V12LootInput): V12LootResult {
  const equipmentId = REWARDS[`${input.source}:${input.key}`]
  if (!equipmentId) return { equipmentId: null, duplicate: false, materials: 0 }
  if (input.owned.includes(equipmentId)) {
    return { equipmentId: null, duplicate: true, materials: DUPLICATE_MATERIALS[equipmentId] }
  }
  return { equipmentId, duplicate: false, materials: 0 }
}
