import { describe, expect, it } from 'vitest'
import { resolveV12Loot } from './v12-loot'

describe('V12 contextual loot', () => {
  it('maps ordinary, boss, hidden and bond sources to contextual equipment', () => {
    expect(resolveV12Loot({ source: 'battle', key: 'training', owned: [] }).equipmentId).toBe('training_blade')
    expect(resolveV12Loot({ source: 'boss', key: 'astral', owned: [] }).equipmentId).toBe('star_staff')
    expect(resolveV12Loot({ source: 'hidden', key: 'path', owned: [] }).equipmentId).toBe('explorer_compass')
    expect(resolveV12Loot({ source: 'bond', key: 'companion', owned: [] }).equipmentId).toBe('bond_brooch')
  })

  it('never grants an unknown reward for malformed source data', () => {
    expect(resolveV12Loot({ source: 'boss', key: 'missing', owned: [] })).toEqual({ equipmentId: null, duplicate: false, materials: 0 })
  })

  it('converts duplicates into bounded materials instead of duplicating unique registry ownership', () => {
    expect(resolveV12Loot({ source: 'boss', key: 'astral', owned: ['star_staff'] })).toEqual({ equipmentId: null, duplicate: true, materials: 3 })
    expect(resolveV12Loot({ source: 'battle', key: 'training', owned: ['training_blade'] }).materials).toBe(1)
  })
})
