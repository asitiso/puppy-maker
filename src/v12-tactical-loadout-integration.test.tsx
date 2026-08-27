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
})
