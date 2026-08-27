import { describe, expect, it } from 'vitest'
import { runaBuildAffinity } from './v12-runa-build-affinity'

describe('V12 Runa build affinity', () => {
  it('uses Calling to change which equipment identity is recommended', () => {
    expect(runaBuildAffinity('arcanist', 'curious', 'star_staff').score).toBeGreaterThan(runaBuildAffinity('caretaker', 'curious', 'star_staff').score)
    expect(runaBuildAffinity('pathfinder', 'balanced', 'explorer_compass').tags).toContain('calling')
    expect(runaBuildAffinity('caretaker', 'gentle', 'bond_brooch').tags).toContain('calling')
  })

  it('uses personality as a small secondary preference instead of overriding the build', () => {
    const curious = runaBuildAffinity('arcanist', 'curious', 'star_staff')
    const brave = runaBuildAffinity('arcanist', 'brave', 'star_staff')
    expect(curious.score).toBeGreaterThan(brave.score)
    expect(curious.score - brave.score).toBeLessThanOrEqual(1)
  })

  it('never turns shared equipment into an illegal item', () => {
    const result = runaBuildAffinity('vanguard', 'brave', 'guardian_shield')
    expect(result.allowed).toBe(false)
    expect(result.score).toBe(0)
  })
})
