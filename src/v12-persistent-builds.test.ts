import { describe, expect, it } from 'vitest'
import { emptyV12PersistentBuildState, hydrateV12PersistentBuildState } from './v12-persistent-builds'

describe('V12 persistent character build state', () => {
  it('provides safe defaults for legacy saves', () => {
    const state = emptyV12PersistentBuildState()
    expect(state.characterUnlocks.unlocked).toEqual(['runa'])
    expect(state.characterUnlocks.trialCharacter).toBeNull()
    expect(state.characterBuilds.runLoadoutSnapshot).toBeNull()
    expect(state.equipmentInstances).toEqual([])
    expect(state.modificationMaterials).toBe(0)
  })

  it('sanitizes malformed equipment instances, duplicate instance ids, and materials', () => {
    const state = hydrateV12PersistentBuildState({
      equipmentInstances: [
        { id: 'staff-1', definitionId: 'star_staff', secondaryOptions: ['focus', 'tempo', 'bad'], evolutionBranch: 'chain' },
        { id: 'staff-1', definitionId: 'star_staff', secondaryOptions: ['guard'], evolutionBranch: 'burst' },
        { id: 'bad', definitionId: 'missing' },
      ],
      modificationMaterials: Number.NaN,
    })
    expect(state.equipmentInstances).toHaveLength(1)
    expect(state.equipmentInstances[0]).toEqual({
      id: 'staff-1', definitionId: 'star_staff', secondaryOptions: ['focus', 'tempo'], evolutionBranch: 'chain',
    })
    expect(state.modificationMaterials).toBe(0)
  })

  it('hydrates character unlocks and character builds idempotently', () => {
    const raw = {
      characterUnlocks: { unlocked: ['runa', 'wolf', 'wolf', 'unknown'], trialCharacter: 'cat' },
      characterBuilds: {
        unlockedCharacters: ['runa', 'wolf', 'cat'],
        ownedEquipment: ['training_blade', 'star_staff', 'star_staff'],
        loadout: {
          party: ['runa', 'wolf', 'cat'], leader: 'wolf', outfitId: 'runa_classic',
          equipment: { weapon: 'star_staff', defenseSupport: null, accessory: null },
        },
        runLoadoutSnapshot: null,
      },
      modificationMaterials: 7.9,
    }
    const once = hydrateV12PersistentBuildState(raw)
    const twice = hydrateV12PersistentBuildState(once)
    expect(once.characterUnlocks).toEqual({ unlocked: ['runa', 'wolf'], trialCharacter: 'cat' })
    expect(once.characterBuilds.loadout.leader).toBe('wolf')
    expect(once.characterBuilds.ownedEquipment).toEqual(['training_blade', 'star_staff'])
    expect(once.modificationMaterials).toBe(7)
    expect(twice).toEqual(once)
  })

  it('drops a persisted run snapshot when hydrating because tactical battle sessions are not resumable', () => {
    const raw = {
      characterBuilds: {
        unlockedCharacters: ['runa', 'bear', 'owl'],
        ownedEquipment: ['training_blade'],
        loadout: {
          party: ['runa', 'bear', 'owl'], leader: 'runa', outfitId: 'runa_classic',
          equipment: { weapon: 'training_blade', defenseSupport: null, accessory: null },
        },
        runLoadoutSnapshot: {
          party: ['runa', 'bear', 'owl'], leader: 'runa', outfitId: 'runa_classic',
          equipment: { weapon: 'training_blade', defenseSupport: null, accessory: null },
        },
      },
    }

    const hydrated = hydrateV12PersistentBuildState(raw)

    expect(hydrated.characterBuilds.runLoadoutSnapshot).toBeNull()
    expect(hydrated.characterBuilds.loadout.party).toEqual(['runa', 'bear', 'owl'])
    expect(hydrated.characterBuilds.loadout.equipment.weapon).toBe('training_blade')
  })
})
