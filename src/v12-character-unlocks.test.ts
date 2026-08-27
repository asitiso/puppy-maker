import { describe, expect, it } from 'vitest'
import {
  beginCharacterTrial,
  completeCharacterUnlock,
  createCharacterUnlockState,
  isCharacterPlayable,
  sanitizeCharacterUnlockState,
} from './v12-character-unlocks'

describe('V12 character trial and unlock flow', () => {
  it('keeps Runa playable and introduces special characters through trials', () => {
    const state = createCharacterUnlockState()
    expect(isCharacterPlayable(state, 'runa')).toBe(true)
    expect(isCharacterPlayable(state, 'wolf')).toBe(false)
    expect(beginCharacterTrial(state, 'wolf').trialCharacter).toBe('wolf')
  })

  it('does not permanently unlock a character until its story condition is completed', () => {
    let state = beginCharacterTrial(createCharacterUnlockState(), 'cat')
    expect(completeCharacterUnlock(state, 'cat', false)).toEqual(state)
    state = completeCharacterUnlock(state, 'cat', true)
    expect(isCharacterPlayable(state, 'cat')).toBe(true)
    expect(state.trialCharacter).toBeNull()
  })

  it('keeps unlock completion idempotent and rejects Runa as a trial target', () => {
    const initial = createCharacterUnlockState()
    expect(beginCharacterTrial(initial, 'runa')).toEqual(initial)
    const once = completeCharacterUnlock(beginCharacterTrial(initial, 'bear'), 'bear', true)
    const twice = completeCharacterUnlock(once, 'bear', true)
    expect(twice).toEqual(once)
  })

  it('sanitizes malformed unlock saves and never preserves unknown trial IDs', () => {
    const once = sanitizeCharacterUnlockState({ unlocked: ['runa', 'wolf', 'wolf', 'unknown'], trialCharacter: 'unknown' })
    expect(once).toEqual({ unlocked: ['runa', 'wolf'], trialCharacter: null })
    expect(sanitizeCharacterUnlockState(once)).toEqual(once)
  })
})
