import type { EquipmentDefinition } from './v12-character-builds'

export type OutfitTraitKind = 'expedition_discovery' | 'magic_chain' | 'guardian_intercept'
export type OutfitTrait = { kind: OutfitTraitKind; potency: number }

export const OUTFIT_TRAITS: Record<string, OutfitTrait> = {
  forest_charm: { kind: 'expedition_discovery', potency: 0.08 },
  moon_brooch: { kind: 'magic_chain', potency: 0.06 },
  guardian_charm: { kind: 'guardian_intercept', potency: 0.08 },
}

export function getOutfitTrait(outfitId: string): OutfitTrait | null {
  return OUTFIT_TRAITS[outfitId] ?? null
}

export function previewOutfitSynergy(
  outfitId: string,
  equipment: EquipmentDefinition,
): { active: boolean; bonus: number; kind: OutfitTraitKind | null } {
  const trait = getOutfitTrait(outfitId)
  if (!trait) return { active: false, bonus: 0, kind: null }

  const active =
    trait.kind === 'expedition_discovery' ? equipment.effect.kind === 'hidden_expedition_interaction'
      : trait.kind === 'magic_chain' ? equipment.effect.kind === 'chain_magic'
        : equipment.effect.kind === 'ally_intercept_counter'

  return active ? { active: true, bonus: trait.potency, kind: trait.kind } : { active: false, bonus: 0, kind: null }
}
