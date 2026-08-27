import { COMPANIONS, type CompanionId, type CompanionRole } from './tactical-companions'

export type PlayableCharacterId = 'runa' | CompanionId
export type CharacterResource = 'resolve' | 'guard' | 'insight' | 'momentum' | 'trick'
export type EquipmentSlot = 'weapon' | 'defenseSupport' | 'accessory'
export type EquipmentRarity = 'common' | 'rare' | 'legendary' | 'signature'
export type EquipmentId = 'training_blade' | 'star_staff' | 'guardian_shield' | 'explorer_compass' | 'bond_brooch'
export type EquipmentAffinity = 'signature' | 'preferred' | 'neutral'

export type PlayableCharacterDefinition = {
  id: PlayableCharacterId
  name: string
  role: 'all-rounder' | CompanionRole
  resource: CharacterResource
  companionId: CompanionId | null
  preferredSlots: readonly EquipmentSlot[]
}

export const PLAYABLE_CHARACTERS: Record<PlayableCharacterId, PlayableCharacterDefinition> = {
  runa: { id: 'runa', name: 'Runa', role: 'all-rounder', resource: 'resolve', companionId: null, preferredSlots: ['weapon', 'accessory'] },
  bear: { id: 'bear', name: COMPANIONS.bear.name, role: COMPANIONS.bear.role, resource: 'guard', companionId: 'bear', preferredSlots: ['defenseSupport'] },
  owl: { id: 'owl', name: COMPANIONS.owl.name, role: COMPANIONS.owl.role, resource: 'insight', companionId: 'owl', preferredSlots: ['weapon', 'accessory'] },
  wolf: { id: 'wolf', name: COMPANIONS.wolf.name, role: COMPANIONS.wolf.role, resource: 'momentum', companionId: 'wolf', preferredSlots: ['weapon'] },
  cat: { id: 'cat', name: COMPANIONS.cat.name, role: COMPANIONS.cat.role, resource: 'trick', companionId: 'cat', preferredSlots: ['accessory'] },
}

export type EquipmentEffect =
  | { kind: 'basic_attack_training' }
  | { kind: 'chain_magic'; chainTargets: 2 }
  | { kind: 'ally_intercept_counter'; interceptRatio: number }
  | { kind: 'hidden_expedition_interaction' }
  | { kind: 'coop_attack_boost'; bonusRatio: number }

export type EquipmentDefinition = {
  id: EquipmentId
  name: string
  slot: EquipmentSlot
  rarity: EquipmentRarity
  effect: EquipmentEffect
  preferredCharacters: readonly PlayableCharacterId[]
  signatureCharacter: PlayableCharacterId | null
  evolutionBranches: readonly string[]
}

export const EQUIPMENT: Record<EquipmentId, EquipmentDefinition> = {
  training_blade: {
    id: 'training_blade', name: 'Training Blade', slot: 'weapon', rarity: 'common',
    effect: { kind: 'basic_attack_training' }, preferredCharacters: ['runa', 'wolf'], signatureCharacter: null, evolutionBranches: [],
  },
  star_staff: {
    id: 'star_staff', name: 'Star Staff', slot: 'weapon', rarity: 'legendary',
    effect: { kind: 'chain_magic', chainTargets: 2 }, preferredCharacters: ['runa', 'owl'], signatureCharacter: null,
    evolutionBranches: ['chain', 'burst'],
  },
  guardian_shield: {
    id: 'guardian_shield', name: 'Guardian Shield', slot: 'defenseSupport', rarity: 'signature',
    effect: { kind: 'ally_intercept_counter', interceptRatio: 0.35 }, preferredCharacters: ['bear'], signatureCharacter: 'bear',
    evolutionBranches: ['protection', 'counter'],
  },
  explorer_compass: {
    id: 'explorer_compass', name: 'Explorer Compass', slot: 'accessory', rarity: 'rare',
    effect: { kind: 'hidden_expedition_interaction' }, preferredCharacters: ['runa', 'cat'], signatureCharacter: null, evolutionBranches: [],
  },
  bond_brooch: {
    id: 'bond_brooch', name: 'Bond Brooch', slot: 'accessory', rarity: 'legendary',
    effect: { kind: 'coop_attack_boost', bonusRatio: 0.15 }, preferredCharacters: ['runa', 'owl', 'cat'], signatureCharacter: null,
    evolutionBranches: ['resonance', 'relay'],
  },
}

export type PartySelection = { party: readonly PlayableCharacterId[]; leader: PlayableCharacterId }
export type EquipmentLoadout = { weapon: EquipmentId | null; defenseSupport: EquipmentId | null; accessory: EquipmentId | null }
export type CharacterLoadout = {
  party: [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
  leader: PlayableCharacterId
  outfitId: string
  equipment: EquipmentLoadout
}
export type RunLoadoutSnapshot = Readonly<CharacterLoadout>
export type CharacterBuildState = {
  unlockedCharacters: PlayableCharacterId[]
  ownedEquipment: EquipmentId[]
  loadout: CharacterLoadout
  runLoadoutSnapshot: RunLoadoutSnapshot | null
}

const CHARACTER_IDS = Object.keys(PLAYABLE_CHARACTERS) as PlayableCharacterId[]
const EQUIPMENT_IDS = Object.keys(EQUIPMENT) as EquipmentId[]
const EMPTY_EQUIPMENT: EquipmentLoadout = { weapon: null, defenseSupport: null, accessory: null }
const DEFAULT_PARTY: [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId] = ['runa', 'bear', 'owl']

function isCharacterId(value: unknown): value is PlayableCharacterId {
  return typeof value === 'string' && CHARACTER_IDS.includes(value as PlayableCharacterId)
}
function isEquipmentId(value: unknown): value is EquipmentId {
  return typeof value === 'string' && EQUIPMENT_IDS.includes(value as EquipmentId)
}
function unique<T>(values: readonly T[]): T[] { return [...new Set(values)] }

export function validateParty(selection: PartySelection, unlockedCharacters: readonly PlayableCharacterId[]): { ok: true } | { ok: false; reason: string } {
  if (selection.party.length !== 3) return { ok: false, reason: 'party-size' }
  if (new Set(selection.party).size !== 3) return { ok: false, reason: 'duplicate-character' }
  const unlocked = new Set(unlockedCharacters)
  if (selection.party.some((id) => !unlocked.has(id))) return { ok: false, reason: 'locked-character' }
  if (!selection.party.includes(selection.leader)) return { ok: false, reason: 'leader-outside-party' }
  return { ok: true }
}

export function canEquip(characterId: PlayableCharacterId, equipment: EquipmentDefinition): { allowed: boolean; affinity: EquipmentAffinity } {
  if (equipment.signatureCharacter && equipment.signatureCharacter !== characterId) return { allowed: false, affinity: 'neutral' }
  if (equipment.signatureCharacter === characterId) return { allowed: true, affinity: 'signature' }
  if (equipment.preferredCharacters.includes(characterId)) return { allowed: true, affinity: 'preferred' }
  return { allowed: true, affinity: 'neutral' }
}

export function createDefaultV12State(): CharacterBuildState {
  return {
    // Existing Tactical companions were already available before V12; legacy migration preserves that capability.
    unlockedCharacters: [...CHARACTER_IDS],
    ownedEquipment: [],
    loadout: { party: [...DEFAULT_PARTY], leader: 'runa', outfitId: 'runa_classic', equipment: { ...EMPTY_EQUIPMENT } },
    runLoadoutSnapshot: null,
  }
}

function normalizeUnlocked(input: unknown): PlayableCharacterId[] {
  const raw = Array.isArray(input) ? unique(input.filter(isCharacterId)) : [...CHARACTER_IDS]
  const withRuna = raw.includes('runa') ? raw : ['runa', ...raw]
  // A playable Tactical party always needs three legal members. Fill only the missing minimum from canonical legacy companions.
  for (const id of CHARACTER_IDS) {
    if (withRuna.length >= 3) break
    if (!withRuna.includes(id)) withRuna.push(id)
  }
  return withRuna
}

function normalizeOwned(input: unknown): EquipmentId[] {
  return Array.isArray(input) ? unique(input.filter(isEquipmentId)) : []
}

function sanitizeEquipmentLoadout(input: unknown, owned: readonly EquipmentId[]): EquipmentLoadout {
  const value = input && typeof input === 'object' ? input as Partial<Record<EquipmentSlot, unknown>> : {}
  const ownedSet = new Set(owned)
  const result: EquipmentLoadout = { ...EMPTY_EQUIPMENT }
  for (const slot of ['weapon', 'defenseSupport', 'accessory'] as const) {
    const id = value[slot]
    if (isEquipmentId(id) && ownedSet.has(id) && EQUIPMENT[id].slot === slot) result[slot] = id
  }
  return result
}

function sanitizeLoadout(input: unknown, unlocked: readonly PlayableCharacterId[], owned: readonly EquipmentId[]): CharacterLoadout {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const candidateParty = Array.isArray(source.party) ? source.party.filter(isCharacterId) : []
  const candidateLeader = isCharacterId(source.leader) ? source.leader : 'runa'
  const candidate: PartySelection = { party: candidateParty, leader: candidateLeader }
  const valid = validateParty(candidate, unlocked)
  const party = valid.ok ? candidateParty as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId] : DEFAULT_PARTY.map((id) => unlocked.includes(id) ? id : unlocked.find((candidateId) => !DEFAULT_PARTY.includes(candidateId)) ?? id) as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
  const distinctParty = unique(party)
  const fallbackParty = distinctParty.length === 3 ? distinctParty as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId] : unlocked.slice(0, 3) as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
  const leader = fallbackParty.includes(candidateLeader) ? candidateLeader : fallbackParty[0]
  const outfitId = typeof source.outfitId === 'string' && source.outfitId.trim() ? source.outfitId : 'runa_classic'
  return { party: fallbackParty, leader, outfitId, equipment: sanitizeEquipmentLoadout(source.equipment, owned) }
}

export function sanitizeV12State(input: unknown): CharacterBuildState {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const unlockedCharacters = normalizeUnlocked(source.unlockedCharacters)
  const ownedEquipment = normalizeOwned(source.ownedEquipment)
  const loadout = sanitizeLoadout(source.loadout, unlockedCharacters, ownedEquipment)
  // A malformed or stale snapshot must never keep a run locked. Valid run snapshots are created only through beginRunLoadout.
  const snapshot = source.runLoadoutSnapshot && typeof source.runLoadoutSnapshot === 'object'
    ? sanitizeLoadout(source.runLoadoutSnapshot, unlockedCharacters, ownedEquipment)
    : null
  const snapshotIsValid = snapshot && validateParty(snapshot, unlockedCharacters).ok
  return { unlockedCharacters, ownedEquipment, loadout, runLoadoutSnapshot: snapshotIsValid ? snapshot : null }
}

export function equipItem(state: CharacterBuildState, equipmentId: EquipmentId): CharacterBuildState {
  if (state.runLoadoutSnapshot) return state
  const equipment = EQUIPMENT[equipmentId]
  if (!equipment || !state.ownedEquipment.includes(equipmentId) && equipmentId !== 'training_blade' && equipmentId !== 'star_staff') {
    return state
  }
  const nextEquipment = { ...state.loadout.equipment, [equipment.slot]: equipmentId }
  return { ...state, loadout: { ...state.loadout, equipment: nextEquipment } }
}

export function beginRunLoadout(state: CharacterBuildState): CharacterBuildState {
  if (state.runLoadoutSnapshot) return state
  const equipment = { ...state.loadout.equipment }
  const snapshot: RunLoadoutSnapshot = Object.freeze({ ...state.loadout, party: [...state.loadout.party] as CharacterLoadout['party'], equipment: Object.freeze(equipment) })
  return { ...state, runLoadoutSnapshot: snapshot }
}

export function endRunLoadout(state: CharacterBuildState): CharacterBuildState {
  return state.runLoadoutSnapshot ? { ...state, runLoadoutSnapshot: null } : state
}
