import { describe, expect, it } from 'vitest'
import {
  createCharacterRuntime,
  gainCharacterResource,
  gainSwitchGauge,
  switchLeader,
  canSwitchLeader,
  type CharacterRuntimeState,
} from './v12-tactical-character-mechanics'
import { createDefaultV12State, setParty } from './v12-character-builds'

describe('V12 tactical character mechanics', () => {
  it('creates distinct finite character resources for the current three-person party', () => {
    const runtime = createCharacterRuntime(createDefaultV12State().loadout)
    expect(runtime.activeLeader).toBe('runa')
    expect(runtime.resources).toEqual({ runa: 0, bear: 0, owl: 0 })
    expect(runtime.switchGauge).toBe(0)
  })

  it('sanitizes and caps character resource gain', () => {
    let runtime = createCharacterRuntime(createDefaultV12State().loadout)
    runtime = gainCharacterResource(runtime, 'bear', 40)
    runtime = gainCharacterResource(runtime, 'bear', Number.POSITIVE_INFINITY)
    runtime = gainCharacterResource(runtime, 'bear', 500)
    expect(runtime.resources.bear).toBe(100)
    expect(Object.values(runtime.resources).every(Number.isFinite)).toBe(true)
  })

  it('requires a charged switch gauge, a living party member and a different active leader', () => {
    let runtime = createCharacterRuntime(createDefaultV12State().loadout)
    expect(canSwitchLeader(runtime, 'bear').ok).toBe(false)
    runtime = gainSwitchGauge(runtime, 60)
    expect(canSwitchLeader(runtime, 'bear')).toEqual({ ok: true })
    expect(canSwitchLeader(runtime, 'runa').ok).toBe(false)
    runtime = { ...runtime, defeated: ['bear'] }
    expect(canSwitchLeader(runtime, 'bear').ok).toBe(false)
    expect(canSwitchLeader(runtime, 'cat').ok).toBe(false)
  })

  it('switches the active leader without mutating the locked run loadout and emits a role-specific entry effect', () => {
    const build = setParty(createDefaultV12State(), ['runa', 'bear', 'wolf'], 'runa')
    let runtime = gainSwitchGauge(createCharacterRuntime(build.loadout), 100)
    const result = switchLeader(runtime, 'bear')
    runtime = result.state

    expect(runtime.activeLeader).toBe('bear')
    expect(runtime.switchGauge).toBe(50)
    expect(result.entryEffect.kind).toBe('guard_entry')
    expect(build.loadout.leader).toBe('runa')

    const wolfResult = switchLeader(gainSwitchGauge(runtime, 50), 'wolf')
    expect(wolfResult.entryEffect.kind).toBe('momentum_entry')
  })

  it('is stable under corrupted runtime state instead of producing NaN or invalid switches', () => {
    const corrupted = {
      activeLeader: 'runa',
      party: ['runa', 'bear', 'owl'],
      resources: { runa: Number.NaN, bear: -10, owl: Number.POSITIVE_INFINITY },
      switchGauge: Number.NaN,
      defeated: ['unknown', 'owl'],
    } as unknown as CharacterRuntimeState

    const repaired = gainSwitchGauge(gainCharacterResource(corrupted, 'runa', 25), 50)
    expect(repaired.resources.runa).toBe(25)
    expect(repaired.resources.bear).toBe(0)
    expect(repaired.resources.owl).toBe(0)
    expect(repaired.switchGauge).toBe(50)
    expect(canSwitchLeader(repaired, 'owl').ok).toBe(false)
  })
})
