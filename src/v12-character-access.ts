import type { PlayableCharacterId } from './v12-character-builds'
import {
  beginCharacterTrial,
  completeCharacterUnlock,
  isCharacterPlayable,
  type CharacterUnlockState,
} from './v12-character-unlocks'

export type CharacterAccessContext = 'story' | 'tactical' | 'expedition'

export function canUseCharacterIn(
  state: CharacterUnlockState,
  characterId: PlayableCharacterId,
  context: CharacterAccessContext,
): boolean {
  if (isCharacterPlayable(state, characterId)) return true
  return context === 'story' && state.trialCharacter === characterId
}

export function startStoryCharacterTrial(
  state: CharacterUnlockState,
  characterId: PlayableCharacterId,
): CharacterUnlockState {
  return beginCharacterTrial(state, characterId)
}

export function completeStoryCharacterTrial(
  state: CharacterUnlockState,
  characterId: PlayableCharacterId,
  unlockConditionCompleted: boolean,
): CharacterUnlockState {
  return completeCharacterUnlock(state, characterId, unlockConditionCompleted)
}

export function selectableCharactersFor(
  state: CharacterUnlockState,
  context: Exclude<CharacterAccessContext, 'story'>,
): PlayableCharacterId[] {
  return (['runa', 'bear', 'owl', 'wolf', 'cat'] as PlayableCharacterId[])
    .filter((id) => canUseCharacterIn(state, id, context))
}
