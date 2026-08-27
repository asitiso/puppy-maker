import { describe, expect, it } from 'vitest'
import { initialState, reducer } from './game'

describe('V12 GameState loadout actions',()=>{
  it('persists equipment and outfit changes before a run',()=>{
    let state=reducer(initialState,{type:'ACQUIRE_V12_EQUIPMENT',equipmentId:'star_staff'})
    state=reducer(state,{type:'SET_V12_EQUIPMENT',equipmentId:'star_staff'})
    state=reducer(state,{type:'SET_V12_OUTFIT',outfitId:'forest_charm'})
    expect(state.v12Builds.characterBuilds.loadout.equipment.weapon).toBe('star_staff')
    expect(state.v12Builds.characterBuilds.loadout.outfitId).toBe('forest_charm')
  })

  it('snapshots the current loadout at run start and rejects edits until run end',()=>{
    let state=reducer(initialState,{type:'BEGIN_V12_RUN'})
    expect(state.v12Builds.characterBuilds.runLoadoutSnapshot).not.toBeNull()
    const locked=reducer(state,{type:'SET_V12_OUTFIT',outfitId:'forest_charm'})
    expect(locked).toEqual(state)
    state=reducer(state,{type:'END_V12_RUN'})
    state=reducer(state,{type:'SET_V12_OUTFIT',outfitId:'forest_charm'})
    expect(state.v12Builds.characterBuilds.loadout.outfitId).toBe('forest_charm')
  })

  it('persists a valid V12 party and mirrors Runa + two companions to the legacy Tactical picker',()=>{
    const state=reducer(initialState,{type:'SET_V12_PARTY',party:['runa','wolf','cat'],leader:'wolf'})
    expect(state.v12Builds.characterBuilds.loadout.party).toEqual(['runa','wolf','cat'])
    expect(state.v12Builds.characterBuilds.loadout.leader).toBe('wolf')
    expect(state.selectedTacticalCompanions).toEqual(['wolf','cat'])
  })
})
