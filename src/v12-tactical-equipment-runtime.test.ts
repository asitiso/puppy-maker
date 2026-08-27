import { describe, expect, it } from 'vitest'
import { createBattleSession } from './tactical-battle'
import { resolveTacticalAction } from './tactical-engine'
import { applyV12LoadoutToBattle, hasHiddenExpeditionInteraction } from './v12-tactical-equipment-runtime'
import { acquireEquipment, createDefaultV12State, equipItem, setParty } from './v12-character-builds'

function baseBattle(){
  return createBattleSession([
    {id:'runa',side:'ally',position:'front',maxHp:100,hp:100,agility:20,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,attackPower:20,skillPower:40,supportPower:20},
    {id:'bear',side:'ally',position:'front',maxHp:120,hp:120,agility:10,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,attackPower:15,skillPower:15,supportPower:15},
    {id:'owl',side:'ally',position:'back',maxHp:80,hp:80,agility:8,ap:3,maxAp:3,mp:0,maxMp:10,shield:0,attackPower:10,skillPower:20,supportPower:25},
  ],[
    {id:'e1',side:'enemy',position:'front',maxHp:100,hp:100,agility:5,ap:3,maxAp:3,mp:0,maxMp:10,shield:0},
    {id:'e2',side:'enemy',position:'front',maxHp:100,hp:100,agility:4,ap:3,maxAp:3,mp:0,maxMp:10,shield:0},
    {id:'e3',side:'enemy',position:'back',maxHp:100,hp:100,agility:3,ap:3,maxAp:3,mp:0,maxMp:10,shield:0},
  ],1)
}

describe('V12 behavioral equipment runtime',()=>{
  it('Star Staff chains a skill into a second living enemy',()=>{
    let build=acquireEquipment(createDefaultV12State(),'star_staff')
    build=equipItem(build,'star_staff')
    const session=applyV12LoadoutToBattle(baseBattle(),build.loadout)
    const next=resolveTacticalAction(session,{actorId:'runa',actionId:'skill',targetId:'e1'})
    expect(next.units.find(u=>u.id==='e1')!.hp).toBe(60)
    expect(next.units.find(u=>u.id==='e2')!.hp).toBeLessThan(100)
    expect(next.units.find(u=>u.id==='e3')!.hp).toBe(100)
  })

  it('Guardian Shield lets Bear intercept valid frontline ally damage and counter the attacker',()=>{
    let build=acquireEquipment(createDefaultV12State(),'guardian_shield')
    build=setParty(build,['bear','runa','owl'],'bear')
    build=equipItem(build,'guardian_shield')
    let session=applyV12LoadoutToBattle(baseBattle(),build.loadout)
    session={...session,timeline:['e1','runa','bear','owl','e2','e3']}
    const next=resolveTacticalAction(session,{actorId:'e1',actionId:'attack',targetId:'runa'})
    expect(next.units.find(u=>u.id==='runa')!.hp).toBeGreaterThan(80)
    expect(next.units.find(u=>u.id==='bear')!.hp).toBeLessThan(120)
    expect(next.units.find(u=>u.id==='e1')!.hp).toBeLessThan(100)
  })

  it('Bond Brooch adds a cooperative strike when its leader attacks',()=>{
    let build=acquireEquipment(createDefaultV12State(),'bond_brooch')
    build=equipItem(build,'bond_brooch')
    const session=applyV12LoadoutToBattle(baseBattle(),build.loadout)
    const next=resolveTacticalAction(session,{actorId:'runa',actionId:'attack',targetId:'e1'})
    expect(next.units.find(u=>u.id==='e1')!.hp).toBeLessThan(80)
  })

  it('Explorer Compass exposes hidden expedition interactions outside battle',()=>{
    let build=acquireEquipment(createDefaultV12State(),'explorer_compass')
    build=equipItem(build,'explorer_compass')
    expect(hasHiddenExpeditionInteraction(build.loadout)).toBe(true)
    expect(hasHiddenExpeditionInteraction(createDefaultV12State().loadout)).toBe(false)
  })
})
