import { COMPANIONS, type CompanionId, type CompanionRole } from './tactical-companions'
import { wardrobe } from './game/wardrobe'

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
const WARDROBE_IDS = new Set(wardrobe.map((item) => item.id))
const EMPTY_EQUIPMENT: EquipmentLoadout = { weapon: null, defenseSupport: null, accessory: null }
const DEFAULT_PARTY: [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId] = ['runa', 'bear', 'owl']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
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
    // Existing Tactical companions were already available before V12; migration preserves that capability.
    unlockedCharacters: [...CHARACTER_IDS],
    ownedEquipment: ['training_blade'],
    loadout: { party: [...DEFAULT_PARTY], leader: 'runa', outfitId: 'runa_classic', equipment: { ...EMPTY_EQUIPMENT } },
    runLoadoutSnapshot: null,
  }
}

function normalizeUnlocked(input: unknown): PlayableCharacterId[] {
  const raw: PlayableCharacterId[] = Array.isArray(input) ? unique(input.filter(isCharacterId)) : [...CHARACTER_IDS]
  const result: PlayableCharacterId[] = raw.includes('runa') ? [...raw] : ['runa', ...raw]
  for (const id of CHARACTER_IDS) {
    if (result.length >= 3) break
    if (!result.includes(id)) result.push(id)
  }
  return result
}

function normalizeOwned(input: unknown): EquipmentId[] {
  return Array.isArray(input) ? unique(input.filter(isEquipmentId)) : ['training_blade']
}

function fallbackParty(unlocked: readonly PlayableCharacterId[]): [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId] {
  const ordered = unique([...DEFAULT_PARTY.filter((id) => unlocked.includes(id)), ...unlocked])
  return ordered.slice(0, 3) as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
}

function sanitizeEquipmentLoadout(input: unknown, owned: readonly EquipmentId[], leader: PlayableCharacterId): EquipmentLoadout {
  const value = isRecord(input) ? input : {}
  const ownedSet = new Set(owned)
  const result: EquipmentLoadout = { ...EMPTY_EQUIPMENT }
  for (const slot of ['weapon', 'defenseSupport', 'accessory'] as const) {
    const id = value[slot]
    if (!isEquipmentId(id) || !ownedSet.has(id)) continue
    const equipment = EQUIPMENT[id]
    if (equipment.slot !== slot || !canEquip(leader, equipment).allowed) continue
    result[slot] = id
  }
  return result
}

function sanitizeLoadout(input: unknown, unlocked: readonly PlayableCharacterId[], owned: readonly EquipmentId[]): CharacterLoadout {
  const source = isRecord(input) ? input : {}
  const candidateParty = Array.isArray(source.party) ? source.party.filter(isCharacterId) : []
  const candidateLeader = isCharacterId(source.leader) ? source.leader : 'runa'
  const candidate: PartySelection = { party: candidateParty, leader: candidateLeader }
  const party = validateParty(candidate, unlocked).ok
    ? candidateParty as [PlayableCharacterId, PlayableCharacterId, PlayableCharacterId]
    : fallbackParty(unlocked)
  const leader = party.includes(candidateLeader) ? candidateLeader : party[0]
  const outfitId = typeof source.outfitId === 'string' && WARDROBE_IDS.has(source.outfitId) ? source.outfitId : 'runa_classic'
  return { party, leader, outfitId, equipment: sanitizeEquipmentLoadout(source.equipment, owned, leader) }
}

function hasSnapshotShape(input: unknown): boolean {
  if (!isRecord(input)) return false
  if (!Array.isArray(input.party) || input.party.length !== 3 || !input.party.every(isCharacterId)) return false
  if (!isCharacterId(input.leader) || typeof input.outfitId !== 'string' || !isRecord(input.equipment)) return false
  return true
}

export function sanitizeV12State(input: unknown): CharacterBuildState {
  const source = isRecord(input) ? input : {}
  const unlockedCharacters = normalizeUnlocked(source.unlockedCharacters)
  const ownedEquipment = normalizeOwned(source.ownedEquipment)
  const loadout = sanitizeLoadout(source.loadout, unlockedCharacters, ownedEquipment)
  const runLoadoutSnapshot = hasSnapshotShape(source.runLoadoutSnapshot)
    ? sanitizeLoadout(source.runLoadoutSnapshot, unlockedCharacters, ownedEquipment)
    : null
  return { unlockedCharacters, ownedEquipment, loadout, runLoadoutSnapshot }
}

export function acquireEquipment(state: CharacterBuildState, equipmentId: EquipmentId): CharacterBuildState {
  if (!EQUIPMENT[equipmentId] || state.ownedEquipment.includes(equipmentId)) return state
  return { ...state, ownedEquipment: [...state.ownedEquipment, equipmentId] }
}

export function setParty(
  state: CharacterBuildState,
  party: readonly PlayableCharacterId[],
  leader: PlayableCharacterId,
): CharacterBuildState {
  if (state.runLoadoutSnapshot) return state
  const validation = validateParty({ party, leader }, state.unlockedCharacters)
  if (!validation.ok) return state
  const nextParty = [...party] as CharacterLoadout['party']
  const nextEquipment = sanitizeEquipmentLoadout(state.loadout.equipment, state.ownedEquipment, leader)
  return { ...state, loadout: { ...state.loadout, party: nextParty, leader, equipment: nextEquipment } }
}

export function setOutfit(state: CharacterBuildState, outfitId: string): CharacterBuildState {
  if (state.runLoadoutSnapshot || !WARDROBE_IDS.has(outfitId)) return state
  return { ...state, loadout: { ...state.loadout, outfitId } }
}

export function equipItem(state: CharacterBuildState, equipmentId: EquipmentId): CharacterBuildState {
  if (state.runLoadoutSnapshot || !state.ownedEquipment.includes(equipmentId)) return state
  const equipment = EQUIPMENT[equipmentId]
  if (!equipment || !canEquip(state.loadout.leader, equipment).allowed) return state
  const nextEquipment = { ...state.loadout.equipment, [equipment.slot]: equipmentId }
  return { ...state, loadout: { ...state.loadout, equipment: nextEquipment } }
}

export function beginRunLoadout(state: CharacterBuildState): CharacterBuildState {
  if (state.runLoadoutSnapshot) return state
  const equipment = Object.freeze({ ...state.loadout.equipment })
  const snapshot: RunLoadoutSnapshot = Object.freeze({
    ...state.loadout,
    party: Object.freeze([...state.loadout.party]) as unknown as CharacterLoadout['party'],
    equipment,
  })
  return { ...state, runLoadoutSnapshot: snapshot }
}

export function endRunLoadout(state: CharacterBuildState): CharacterBuildState {
  return state.runLoadoutSnapshot ? { ...state, runLoadoutSnapshot: null } : state
}
