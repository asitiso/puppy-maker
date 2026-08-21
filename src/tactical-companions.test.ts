import { describe, expect, it } from 'vitest'
import { COMPANIONS, bondLevelForXp, deriveCompanionUnit, grantBattleBond, recommendedFormation } from './tactical-companions'

describe('tactical companions', () => {
  it('defines four distinct companion roles', () => {
    expect(Object.keys(COMPANIONS)).toEqual(['bear', 'owl', 'wolf', 'cat'])
    expect(new Set(Object.values(COMPANIONS).map((entry) => entry.role)).size).toBe(4)
  })

  it('derives companion combat power from leader progression', () => {
    const low = deriveCompanionUnit('wolf', { power: 20, magic: 10, agility: 12, maxHp: 100 })
    const high = deriveCompanionUnit('wolf', { power: 60, magic: 30, agility: 36, maxHp: 300 })
    expect(high.power).toBeGreaterThan(low.power)
    expect(high.maxHp).toBeGreaterThan(low.maxHp)
  })

  it('sanitizes non-finite leader progression before deriving companion state', () => {
    const companion = deriveCompanionUnit('owl', {
      power:Number.NaN,
      magic:Number.POSITIVE_INFINITY,
      agility:Number.NEGATIVE_INFINITY,
      maxHp:Number.NaN,
    })
    for (const value of [companion.maxHp,companion.hp,companion.agility,companion.power,companion.magic,companion.attackPower,companion.skillPower,companion.supportPower]) {
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(1)
    }
  })

  it('caps finite-but-huge leader progression before derived arithmetic overflows', () => {
    const companion = deriveCompanionUnit('wolf', {power:Number.MAX_VALUE,magic:Number.MAX_VALUE,agility:Number.MAX_VALUE,maxHp:Number.MAX_VALUE})
    for (const value of [companion.maxHp,companion.hp,companion.agility,companion.power,companion.magic,companion.attackPower,companion.skillPower,companion.supportPower]) {
      expect(Number.isSafeInteger(value)).toBe(true)
    }
  })

  it('keeps tank, support, striker and trickster identities distinct in derived combat stats', () => {
    const leader = { power: 60, magic: 50, agility: 30, maxHp: 140 }
    const bear = deriveCompanionUnit('bear', leader)
    const owl = deriveCompanionUnit('owl', leader)
    const wolf = deriveCompanionUnit('wolf', leader)
    const cat = deriveCompanionUnit('cat', leader)

    expect(bear.maxHp).toBeGreaterThan(Math.max(owl.maxHp,wolf.maxHp,cat.maxHp))
    expect(owl.supportPower).toBeGreaterThan(Math.max(bear.supportPower,wolf.supportPower,cat.supportPower))
    expect(wolf.attackPower).toBeGreaterThan(Math.max(bear.attackPower,owl.attackPower,cat.attackPower))
    expect(cat.agility).toBeGreaterThan(Math.max(bear.agility,owl.agility,wolf.agility))
  })

  it('recommends a legal front/back formation for any selected pair', () => {
    const formation = recommendedFormation(['bear', 'owl'])
    expect(formation.runa).toBe('front')
    expect(formation.bear).toBe('front')
    expect(formation.owl).toBe('back')
  })

  it('maps bond xp into five capped levels and grants battle bond', () => {
    expect([0, 25, 75, 150, 300].map(bondLevelForXp)).toEqual([1, 2, 3, 4, 5])
    expect(bondLevelForXp(9999)).toBe(5)
    expect(grantBattleBond({ xp: 295 }, 20)).toEqual({ xp: 300, level: 5 })
  })

  it('sanitizes corrupted or non-finite bond inputs instead of persisting NaN', () => {
    expect(grantBattleBond({ xp: Number.NaN }, 10)).toEqual({ xp: 10, level: 1 })
    expect(grantBattleBond({ xp: Number.POSITIVE_INFINITY }, 20)).toEqual({ xp: 20, level: 1 })
    expect(grantBattleBond({ xp: 150 }, Number.NaN)).toEqual({ xp: 150, level: 4 })
    expect(grantBattleBond({ xp: -100 }, 5)).toEqual({ xp: 5, level: 1 })
  })
})
