import { createDefaultV12State, sanitizeV12State, type CharacterBuildState } from './v12-character-builds'
import { createCharacterUnlockState, sanitizeCharacterUnlockState, type CharacterUnlockState } from './v12-character-unlocks'
import { sanitizeEquipmentInstance, type EquipmentInstance } from './v12-equipment-progression'

export type V12PersistentBuildState = {
  characterBuilds: CharacterBuildState
  characterUnlocks: CharacterUnlockState
  equipmentInstances: EquipmentInstance[]
  modificationMaterials: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function safeMaterials(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function sanitizeEquipmentInstances(value: unknown): EquipmentInstance[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: EquipmentInstance[] = []
  for (const entry of value) {
    const item = sanitizeEquipmentInstance(entry)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }
  return result
}

export function emptyV12PersistentBuildState(): V12PersistentBuildState {
  return {
    characterBuilds: createDefaultV12State(),
    characterUnlocks: createCharacterUnlockState(),
    equipmentInstances: [],
    modificationMaterials: 0,
  }
}

export function hydrateV12PersistentBuildState(input: unknown): V12PersistentBuildState {
  const source = isRecord(input) ? input : {}
  return {
    characterBuilds: sanitizeV12State(source.characterBuilds),
    characterUnlocks: sanitizeCharacterUnlockState(source.characterUnlocks),
    equipmentInstances: sanitizeEquipmentInstances(source.equipmentInstances),
    modificationMaterials: safeMaterials(source.modificationMaterials),
  }
}
