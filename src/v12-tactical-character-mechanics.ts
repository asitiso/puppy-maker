import type { CharacterLoadout, PlayableCharacterId } from './v12-character-builds'

export type CharacterRuntimeState = {
  activeLeader: PlayableCharacterId
  party: [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
  resources: Partial<Record<PlayableCharacterId, number>>
  switchGauge: number
  defeated: PlayableCharacterId[]
}

export type EntryEffect =
  | { kind: 'resolve_entry'; value: number }
  | { kind: 'guard_entry'; value: number }
  | { kind: 'insight_entry'; value: number }
  | { kind: 'momentum_entry'; value: number }
  | { kind: 'trick_entry'; value: number }

const SWITCH_COST = 50
const clampResource = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0

function normalizeRuntime(state: CharacterRuntimeState): CharacterRuntimeState {
  const party = Array.isArray(state.party) ? state.party.filter((id): id is PlayableCharacterId => ['runa', 'bear', 'owl', 'wolf', 'cat'].includes(String(id))) : []
  const normalizedParty = [...new Set(party)].slice(0, 3) as PlayableCharacterId[]
  const fallbackParty: [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId] = normalizedParty.length === 3
    ? normalizedParty as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
    : ['runa', 'bear', 'owl']
  const activeLeader = fallbackParty.includes(state.activeLeader) ? state.activeLeader : fallbackParty[0]
  const resources: Partial<Record<PlayableCharacterId, number>> = {}
  for (const id of fallbackParty) resources[id] = clampResource(state.resources?.[id])
  const defeated = Array.isArray(state.defeated)
    ? [...new Set(state.defeated.filter((id): id is PlayableCharacterId => fallbackParty.includes(id as PlayableCharacterId)))]
    : []
  return { activeLeader, party: fallbackParty, resources, switchGauge: clampResource(state.switchGauge), defeated }
}

export function createCharacterRuntime(loadout: CharacterLoadout): CharacterRuntimeState {
  return {
    activeLeader: loadout.leader,
    party: [...loadout.party],
    resources: Object.fromEntries(loadout.party.map((id) => [id, 0])),
    switchGauge: 0,
    defeated: [],
  }
}

export function gainCharacterResource(state: CharacterRuntimeState, characterId: PlayableCharacterId, amount: number): CharacterRuntimeState {
  const safe = normalizeRuntime(state)
  if (!safe.party.includes(characterId)) return safe
  const gain = Number.isFinite(amount) ? Math.max(0, amount) : 0
  return { ...safe, resources: { ...safe.resources, [characterId]: clampResource((safe.resources[characterId] ?? 0) + gain) } }
}

export function gainSwitchGauge(state: CharacterRuntimeState, amount: number): CharacterRuntimeState {
  const safe = normalizeRuntime(state)
  const gain = Number.isFinite(amount) ? Math.max(0, amount) : 0
  return { ...safe, switchGauge: clampResource(safe.switchGauge + gain) }
}

export function canSwitchLeader(state: CharacterRuntimeState, nextLeader: PlayableCharacterId): { ok: true } | { ok: false; reason: string } {
  const safe = normalizeRuntime(state)
  if (!safe.party.includes(nextLeader)) return { ok: false, reason: 'not-in-party' }
  if (safe.activeLeader === nextLeader) return { ok: false, reason: 'already-active' }
  if (safe.defeated.includes(nextLeader)) return { ok: false, reason: 'defeated' }
  if (safe.switchGauge < SWITCH_COST) return { ok: false, reason: 'switch-gauge' }
  return { ok: true }
}

function entryEffectFor(characterId: PlayableCharacterId): EntryEffect {
  switch (characterId) {
    case 'bear': return { kind: 'guard_entry', value: 20 }
    case 'owl': return { kind: 'insight_entry', value: 20 }
    case 'wolf': return { kind: 'momentum_entry', value: 20 }
    case 'cat': return { kind: 'trick_entry', value: 20 }
    default: return { kind: 'resolve_entry', value: 20 }
  }
}

export function switchLeader(
  state: CharacterRuntimeState,
  nextLeader: PlayableCharacterId,
): { state: CharacterRuntimeState; entryEffect: EntryEffect } {
  const safe = normalizeRuntime(state)
  const validation = canSwitchLeader(safe, nextLeader)
  if (!validation.ok) return { state: safe, entryEffect: entryEffectFor(safe.activeLeader) }
  const nextState = {
    ...safe,
    activeLeader: nextLeader,
    switchGauge: clampResource(safe.switchGauge - SWITCH_COST),
  }
  return { state: nextState, entryEffect: entryEffectFor(nextLeader) }
}
