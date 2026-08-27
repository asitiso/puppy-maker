import { describe, expect, it } from 'vitest'
import { createTacticalBattleFromGame } from './tactical-launcher'
import { acquireEquipment, beginRunLoadout, equipItem } from './v12-character-builds'
import { initialState } from './game'

describe('V12 tactical launcher equipment wiring',()=>{
  it('injects persisted leader equipment into the real tactical battle session',()=>{
    let builds=acquireEquipment(initialState.v12Builds.characterBuilds,'star_staff')
    builds=equipItem(builds,'star_staff')
    const state={...initialState,v12Builds:{...initialState.v12Builds,characterBuilds:builds}}
    const battle=createTacticalBattleFromGame(state,'forest_path',7)
    const runa=battle.units.find(unit=>unit.id==='runa') as typeof battle.units[number]&{v12EquipmentEffects?:Array<{kind:string}>}
    expect(runa.v12EquipmentEffects?.some(effect=>effect.kind==='chain_magic')).toBe(true)
  })

  it('prefers the immutable run snapshot over later mutable loadout data',()=>{
    let builds=acquireEquipment(initialState.v12Builds.characterBuilds,'star_staff')
    builds=equipItem(builds,'star_staff')
    builds=beginRunLoadout(builds)
    const drifted={...builds,loadout:{...builds.loadout,equipment:{...builds.loadout.equipment,weapon:'training_blade' as const}}}
    const state={...initialState,v12Builds:{...initialState.v12Builds,characterBuilds:drifted}}
    const battle=createTacticalBattleFromGame(state,'forest_path',8)
    const runa=battle.units.find(unit=>unit.id==='runa') as typeof battle.units[number]&{v12EquipmentEffects?:Array<{kind:string}>}
    expect(runa.v12EquipmentEffects?.some(effect=>effect.kind==='chain_magic')).toBe(true)
  })
})
