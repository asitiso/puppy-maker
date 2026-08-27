// @ts-ignore -- source contract reads execute outside app tsconfig Node globals.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./TacticalExpeditionFlow.tsx', import.meta.url), 'utf8')

describe('V12 Tactical setup integration', () => {
  it('shows the V12 loadout summary in the actual Tactical expedition setup flow', () => {
    expect(source).toContain("import V12LoadoutPanel from './V12LoadoutPanel'")
    expect(source).toContain('state.v12Builds.characterBuilds')
    expect(source).toContain('<V12LoadoutPanel')
    expect(source).toContain('onStartRun={start}')
  })

  it('keeps the existing companion picker as the compatibility editing surface', () => {
    expect(source).toContain('tactical-party-picker')
    expect(source).toContain('chooseCompanion')
    expect(source).toContain('id="v12-tactical-party-picker"')
  })

  it('opens the real V12 editor for Leader, outfit and all three equipment slots', () => {
    expect(source).toContain("import V12BuildEditor")
    expect(source).toContain("from './game/wardrobe'")
    expect(source).toContain('onEditParty={() => setEditor(\'party\')}')
    expect(source).toContain('onEditOutfit={() => setEditor(\'outfit\')}')
    expect(source).toContain('onEditEquipment={slot => setEditor(slot)}')
    expect(source).toContain('<V12BuildEditor')
    expect(source).toContain('unlockedOutfitIds={unlockedOutfitIds}')
  })

  it('persists editor choices and locks/unlocks the run through the V12 production event bridge', () => {
    expect(source).toContain("import { requestV12Build }")
    expect(source).toContain("requestV12Build({type:'begin-run'})")
    expect(source).toContain("requestV12Build({type:'end-run'})")
    expect(source).toContain("requestV12Build({type:'outfit',outfitId})")
    expect(source).toContain("requestV12Build({type:'equipment',equipmentId})")
    expect(source).toContain("requestV12Build({type:'party',party:buildState.loadout.party,leader})")
  })
})
