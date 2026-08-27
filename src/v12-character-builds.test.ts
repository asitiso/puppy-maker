import { describe, expect, it } from 'vitest'
import {
  PLAYABLE_CHARACTERS,
  EQUIPMENT,
  acquireEquipment,
  beginRunLoadout,
  canEquip,
  createDefaultV12State,
  endRunLoadout,
  equipItem,
  sanitizeV12State,
  setParty,
  setOutfit,
  validateParty,
  type CharacterBuildState,
} from './v12-character-builds'

describe('V12 character builds foundation', () => {
  it('promotes Runa and all four tactical companions into one canonical playable roster', () => {
    expect(Object.keys(PLAYABLE_CHARACTERS)).toEqual(['runa', 'bear', 'owl', 'wolf', 'cat'])
    expect(PLAYABLE_CHARACTERS.bear.companionId).toBe('bear')
    expect(PLAYABLE_CHARACTERS.owl.companionId).toBe('owl')
    expect(PLAYABLE_CHARACTERS.runa.companionId).toBeNull()
    expect(new Set(Object.values(PLAYABLE_CHARACTERS).map((entry) => entry.resource)).size).toBe(5)
  })

  it('requires exactly three distinct unlocked party members and keeps the leader inside the party', () => {
    const unlocked = ['runa', 'bear', 'owl', 'wolf'] as const
    expect(validateParty({ party: ['runa', 'bear', 'owl'], leader: 'runa' }, unlocked)).toEqual({ ok: true })
    expect(validateParty({ party: ['runa', 'bear', 'bear'], leader: 'runa' }, unlocked).ok).toBe(false)
    expect(validateParty({ party: ['runa', 'bear', 'cat'], leader: 'runa' }, unlocked).ok).toBe(false)
    expect(validateParty({ party: ['runa', 'bear', 'owl'], leader: 'cat' }, unlocked).ok).toBe(false)
  })

  it('keeps outfit separate from the three equipment slots and starts with a safe legacy party', () => {
    const state = createDefaultV12State()
    expect(state.loadout.party).toEqual(['runa', 'bear', 'owl'])
    expect(state.loadout.leader).toBe('runa')
    expect(state.loadout.outfitId).toBe('runa_classic')
    expect(state.loadout.equipment).toEqual({ weapon: null, defenseSupport: null, accessory: null })
    expect(state.ownedEquipment).toEqual(['training_blade'])
  })

  it('defines behavioral equipment identities across all three slots and signature affinity', () => {
    expect(EQUIPMENT.star_staff.effect.kind).toBe('chain_magic')
    expect(EQUIPMENT.guardian_shield.effect.kind).toBe('ally_intercept_counter')
    expect(EQUIPMENT.explorer_compass.effect.kind).toBe('hidden_expedition_interaction')
    expect(EQUIPMENT.bond_brooch.effect.kind).toBe('coop_attack_boost')
    expect(EQUIPMENT.guardian_shield.slot).toBe('defenseSupport')
  })

  it('allows shared gear, applies affinity, and restricts signature gear without fragmenting the inventory', () => {
    expect(canEquip('runa', EQUIPMENT.star_staff)).toEqual({ allowed: true, affinity: 'preferred' })
    expect(canEquip('bear', EQUIPMENT.star_staff)).toEqual({ allowed: true, affinity: 'neutral' })
    expect(canEquip('bear', EQUIPMENT.guardian_shield)).toEqual({ allowed: true, affinity: 'signature' })
    expect(canEquip('owl', EQUIPMENT.guardian_shield).allowed).toBe(false)
  })

  it('requires ownership, deduplicates acquisition, and respects leader signature restrictions', () => {
    let state = createDefaultV12State()
    expect(equipItem(state, 'star_staff')).toEqual(state)

    state = acquireEquipment(state, 'star_staff')
    state = acquireEquipment(state, 'star_staff')
    expect(state.ownedEquipment.filter((id) => id === 'star_staff')).toHaveLength(1)
    expect(equipItem(state, 'star_staff').loadout.equipment.weapon).toBe('star_staff')

    state = acquireEquipment(state, 'guardian_shield')
    expect(equipItem(state, 'guardian_shield')).toEqual(state)
    state = setParty(state, ['bear', 'runa', 'owl'], 'bear')
    expect(equipItem(state, 'guardian_shield').loadout.equipment.defenseSupport).toBe('guardian_shield')
  })

  it('locks party, outfit and equipment mutation during a run and restores editing when the run ends', () => {
    let state = createDefaultV12State()
    state = acquireEquipment(state, 'star_staff')
    state = equipItem(state, 'star_staff')
    state = setOutfit(state, 'forest_charm')
    expect(state.loadout.equipment.weapon).toBe('star_staff')
    expect(state.loadout.outfitId).toBe('forest_charm')

    state = beginRunLoadout(state)
    expect(setParty(state, ['runa', 'wolf', 'cat'], 'wolf')).toEqual(state)
    expect(setOutfit(state, 'runa_classic')).toEqual(state)
    expect(equipItem(state, 'training_blade')).toEqual(state)
    expect(state.runLoadoutSnapshot?.equipment.weapon).toBe('star_staff')
    expect(state.runLoadoutSnapshot?.outfitId).toBe('forest_charm')

    state = endRunLoadout(state)
    state = equipItem(state, 'training_blade')
    expect(state.loadout.equipment.weapon).toBe('training_blade')
  })

  it('sanitizes old or malformed save data into a legal, idempotent V12 state', () => {
    const malformed = {
      unlockedCharacters: ['runa', 'cat', 'cat', 'unknown'],
      ownedEquipment: ['star_staff', 'star_staff', 'missing'],
      loadout: {
        party: ['cat', 'cat', 'unknown'],
        leader: 'unknown',
        outfitId: 'deleted_outfit',
        equipment: { weapon: 'guardian_shield', defenseSupport: 'star_staff', accessory: 'missing' },
      },
      runLoadoutSnapshot: { nonsense: true },
    } as unknown as CharacterBuildState

    const once = sanitizeV12State(malformed)
    const twice = sanitizeV12State(once)

    expect(once.unlockedCharacters).toEqual(['runa', 'cat', 'bear'])
    expect(once.ownedEquipment).toEqual(['star_staff'])
    expect(once.loadout.party).toEqual(['runa', 'bear', 'cat'])
    expect(once.loadout.leader).toBe('runa')
    expect(once.loadout.outfitId).toBe('runa_classic')
    expect(once.loadout.equipment).toEqual({ weapon: null, defenseSupport: null, accessory: null })
    expect(once.runLoadoutSnapshot).toBeNull()
    expect(twice).toEqual(once)
  })
})
