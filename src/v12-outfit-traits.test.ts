import { describe, expect, it } from 'vitest'
import { wardrobe } from './game/wardrobe'
import { EQUIPMENT } from './v12-character-builds'
import { OUTFIT_TRAITS, getOutfitTrait, previewOutfitSynergy } from './v12-outfit-traits'

describe('V12 outfit trait layer', () => {
  it('extends existing wardrobe IDs instead of creating a parallel outfit registry', () => {
    const wardrobeIds = new Set(wardrobe.map((item) => item.id))
    expect(Object.keys(OUTFIT_TRAITS).every((id) => wardrobeIds.has(id))).toBe(true)
  })

  it('keeps outfit traits deliberately small and cosmetics usable without a trait', () => {
    for (const trait of Object.values(OUTFIT_TRAITS)) expect(trait.potency).toBeLessThanOrEqual(0.1)
    expect(getOutfitTrait('runa_classic')).toBeNull()
    expect(getOutfitTrait('brook_ribbon')).toBeNull()
  })

  it('rewards thematic equipment synergy without making the outfit mandatory', () => {
    expect(previewOutfitSynergy('forest_charm', EQUIPMENT.explorer_compass)).toEqual({ active: true, bonus: 0.08, kind: 'expedition_discovery' })
    expect(previewOutfitSynergy('moon_brooch', EQUIPMENT.star_staff)).toEqual({ active: true, bonus: 0.06, kind: 'magic_chain' })
    expect(previewOutfitSynergy('guardian_charm', EQUIPMENT.guardian_shield)).toEqual({ active: true, bonus: 0.08, kind: 'guardian_intercept' })
    expect(previewOutfitSynergy('forest_charm', EQUIPMENT.star_staff)).toEqual({ active: false, bonus: 0, kind: null })
  })
})
