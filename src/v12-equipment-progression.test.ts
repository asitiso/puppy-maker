import { describe, expect, it } from 'vitest'
import {
  createEquipmentInstance,
  evolveEquipment,
  modifySecondaryOption,
  sanitizeEquipmentInstance,
  type EquipmentInstance,
} from './v12-equipment-progression'

describe('V12 equipment progression', () => {
  it('creates stable instances with no more than two secondary options', () => {
    const instance = createEquipmentInstance('star_staff', 'gear-star-1', ['focus', 'tempo', 'guard'])
    expect(instance).toEqual({ id: 'gear-star-1', definitionId: 'star_staff', secondaryOptions: ['focus', 'tempo'], evolutionBranch: null })
  })

  it('allows one valid evolution branch and locks the route afterwards', () => {
    let instance = createEquipmentInstance('star_staff', 'gear-star-1')
    instance = evolveEquipment(instance, 'chain')
    expect(instance.evolutionBranch).toBe('chain')
    expect(evolveEquipment(instance, 'burst')).toEqual(instance)
    expect(evolveEquipment(createEquipmentInstance('training_blade', 'basic-1'), 'chain').evolutionBranch).toBeNull()
  })

  it('limits modification to a valid unique secondary option set', () => {
    let instance = createEquipmentInstance('bond_brooch', 'brooch-1', ['bond'])
    instance = modifySecondaryOption(instance, 0, 'tempo')
    expect(instance.secondaryOptions).toEqual(['tempo'])
    instance = modifySecondaryOption(instance, 1, 'focus')
    expect(instance.secondaryOptions).toEqual(['tempo', 'focus'])
    expect(modifySecondaryOption(instance, 0, 'focus')).toEqual(instance)
    expect(modifySecondaryOption(instance, 2, 'guard')).toEqual(instance)
  })

  it('sanitizes malformed instances and is idempotent', () => {
    const malformed = {
      id: ' gear-7 ',
      definitionId: 'star_staff',
      secondaryOptions: ['focus', 'focus', 'invalid', 'tempo'],
      evolutionBranch: 'not-a-route',
    } as unknown as EquipmentInstance
    const once = sanitizeEquipmentInstance(malformed)
    const twice = sanitizeEquipmentInstance(once)
    expect(once).toEqual({ id: 'gear-7', definitionId: 'star_staff', secondaryOptions: ['focus', 'tempo'], evolutionBranch: null })
    expect(twice).toEqual(once)
  })

  it('rejects missing IDs and unknown definitions instead of creating ghost inventory entries', () => {
    expect(sanitizeEquipmentInstance({ id: '', definitionId: 'star_staff' })).toBeNull()
    expect(sanitizeEquipmentInstance({ id: 'ghost', definitionId: 'missing' })).toBeNull()
  })
})
