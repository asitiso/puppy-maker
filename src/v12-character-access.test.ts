import { describe, expect, it } from 'vitest'
import { createCharacterUnlockState } from './v12-character-unlocks'
import {
  canUseCharacterIn,
  completeStoryCharacterTrial,
  selectableCharactersFor,
  startStoryCharacterTrial,
} from './v12-character-access'

describe('V12 character access flow', () => {
  it('allows a locked special character only in its active Story trial', () => {
    const initial = createCharacterUnlockState()
    const trial = startStoryCharacterTrial(initial, 'wolf')
    expect(canUseCharacterIn(trial, 'wolf', 'story')).toBe(true)
    expect(canUseCharacterIn(trial, 'wolf', 'tactical')).toBe(false)
    expect(canUseCharacterIn(trial, 'wolf', 'expedition')).toBe(false)
  })

  it('promotes a completed Story trial into Tactical and Expedition access', () => {
    const trial = startStoryCharacterTrial(createCharacterUnlockState(), 'owl')
    const unlocked = completeStoryCharacterTrial(trial, 'owl', true)
    expect(canUseCharacterIn(unlocked, 'owl', 'tactical')).toBe(true)
    expect(canUseCharacterIn(unlocked, 'owl', 'expedition')).toBe(true)
    expect(selectableCharactersFor(unlocked, 'tactical')).toEqual(['runa', 'owl'])
  })

  it('does not unlock when the trial condition is incomplete', () => {
    const trial = startStoryCharacterTrial(createCharacterUnlockState(), 'cat')
    const unchanged = completeStoryCharacterTrial(trial, 'cat', false)
    expect(selectableCharactersFor(unchanged, 'expedition')).toEqual(['runa'])
  })
})
