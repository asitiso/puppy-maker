import type { PlayableCharacterId } from './v12-character-builds'

export type CharacterUnlockState = {
  unlocked: PlayableCharacterId[]
  trialCharacter: PlayableCharacterId | null
}

const CHARACTER_IDS: readonly PlayableCharacterId[] = ['runa', 'bear', 'owl', 'wolf', 'cat']
const TRIAL_CHARACTER_IDS: readonly PlayableCharacterId[] = ['bear', 'owl', 'wolf', 'cat']

function isCharacterId(value: unknown): value is PlayableCharacterId {
  return typeof value === 'string' && CHARACTER_IDS.includes(value as PlayableCharacterId)
}

function isTrialCharacterId(value: unknown): value is PlayableCharacterId {
  return isCharacterId(value) && value !== 'runa'
}

export function createCharacterUnlockState(): CharacterUnlockState {
  return { unlocked: ['runa'], trialCharacter: null }
}

export function sanitizeCharacterUnlockState(input: unknown): CharacterUnlockState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return createCharacterUnlockState()
  const source = input as Record<string, unknown>
  const rawUnlocked = Array.isArray(source.unlocked) ? source.unlocked.filter(isCharacterId) : []
  const unlocked = [...new Set<PlayableCharacterId>(['runa', ...rawUnlocked])]
  const trialCharacter = isTrialCharacterId(source.trialCharacter) && !unlocked.includes(source.trialCharacter)
    ? source.trialCharacter
    : null
  return { unlocked, trialCharacter }
}

export function isCharacterPlayable(state: CharacterUnlockState, characterId: PlayableCharacterId): boolean {
  return state.unlocked.includes(characterId)
}

export function beginCharacterTrial(state: CharacterUnlockState, characterId: PlayableCharacterId): CharacterUnlockState {
  if (!TRIAL_CHARACTER_IDS.includes(characterId) || state.unlocked.includes(characterId)) return state
  if (state.trialCharacter === characterId) return state
  return { ...state, trialCharacter: characterId }
}

export function completeCharacterUnlock(
  state: CharacterUnlockState,
  characterId: PlayableCharacterId,
  conditionCompleted: boolean,
): CharacterUnlockState {
  if (!conditionCompleted || !isTrialCharacterId(characterId)) return state
  if (state.unlocked.includes(characterId)) return state
  if (state.trialCharacter !== characterId) return state
  return {
    unlocked: [...state.unlocked, characterId],
    trialCharacter: null,
  }
}
