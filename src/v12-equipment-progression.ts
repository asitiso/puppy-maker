import { EQUIPMENT, type EquipmentId } from './v12-character-builds'

export type SecondaryOptionId = 'focus' | 'tempo' | 'guard' | 'bond'
export type EquipmentInstance = {
  id: string
  definitionId: EquipmentId
  secondaryOptions: SecondaryOptionId[]
  evolutionBranch: string | null
}

const SECONDARY_OPTIONS: SecondaryOptionId[] = ['focus', 'tempo', 'guard', 'bond']

function isSecondaryOption(value: unknown): value is SecondaryOptionId {
  return typeof value === 'string' && SECONDARY_OPTIONS.includes(value as SecondaryOptionId)
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

export function sanitizeEquipmentInstance(input: unknown): EquipmentInstance | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const source = input as Record<string, unknown>
  const id = typeof source.id === 'string' ? source.id.trim() : ''
  const definitionId = typeof source.definitionId === 'string' && source.definitionId in EQUIPMENT
    ? source.definitionId as EquipmentId
    : null
  if (!id || !definitionId) return null

  const secondaryOptions = Array.isArray(source.secondaryOptions)
    ? unique(source.secondaryOptions.filter(isSecondaryOption)).slice(0, 2)
    : []
  const requestedBranch = typeof source.evolutionBranch === 'string' ? source.evolutionBranch : null
  const evolutionBranch = requestedBranch && EQUIPMENT[definitionId].evolutionBranches.includes(requestedBranch)
    ? requestedBranch
    : null
  return { id, definitionId, secondaryOptions, evolutionBranch }
}

export function createEquipmentInstance(
  definitionId: EquipmentId,
  id: string,
  secondaryOptions: readonly SecondaryOptionId[] = [],
): EquipmentInstance {
  return sanitizeEquipmentInstance({ id, definitionId, secondaryOptions, evolutionBranch: null }) ?? {
    id: id.trim(),
    definitionId,
    secondaryOptions: [],
    evolutionBranch: null,
  }
}

export function evolveEquipment(instance: EquipmentInstance, branch: string): EquipmentInstance {
  const safe = sanitizeEquipmentInstance(instance)
  if (!safe || safe.evolutionBranch) return safe ?? instance
  const definition = EQUIPMENT[safe.definitionId]
  if (!definition.evolutionBranches.includes(branch)) return safe
  return { ...safe, evolutionBranch: branch }
}

export function modifySecondaryOption(
  instance: EquipmentInstance,
  index: number,
  option: SecondaryOptionId,
): EquipmentInstance {
  const safe = sanitizeEquipmentInstance(instance)
  if (!safe || !Number.isInteger(index) || index < 0 || index > 1 || !isSecondaryOption(option)) return safe ?? instance
  if (safe.secondaryOptions.includes(option) && safe.secondaryOptions[index] !== option) return safe
  if (index > safe.secondaryOptions.length) return safe
  const secondaryOptions = [...safe.secondaryOptions]
  secondaryOptions[index] = option
  return { ...safe, secondaryOptions }
}
