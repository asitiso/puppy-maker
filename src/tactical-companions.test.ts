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
})
