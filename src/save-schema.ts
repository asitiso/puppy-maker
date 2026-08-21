import { hydrateGameState, type GameState } from './game';

export const CURRENT_SAVE_SCHEMA_VERSION = 3 as const;

export type GameSaveEnvelope = {
  schemaVersion: typeof CURRENT_SAVE_SCHEMA_VERSION;
  integrity:string;
  state: GameState;
};

export type SaveInspectionStatus =
  | 'missing'
  | 'invalid-json'
  | 'malformed-envelope'
  | 'integrity-failed'
  | 'legacy'
  | 'migrated-v1'
  | 'migrated-v2'
  | 'future-version'
  | 'valid';

export type SaveInspection = {
  status:SaveInspectionStatus;
  state:GameState;
  schemaVersion:number | null;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value:unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const schemaVersionOf = (value:UnknownRecord) => typeof value.schemaVersion === 'number' && Number.isFinite(value.schemaVersion)
  ? Math.max(0, Math.floor(value.schemaVersion))
  : null;

function integrityForState(state:unknown): string {
  const serialized = JSON.stringify(state);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function validIntegrity(raw:UnknownRecord):boolean {
  return typeof raw.integrity === 'string' && raw.integrity === integrityForState(raw.state);
}

export function createSaveEnvelope(state:GameState): GameSaveEnvelope {
  return {
    schemaVersion:CURRENT_SAVE_SCHEMA_VERSION,
    integrity:integrityForState(state),
    state,
  };
}

function inspectRawSavedGame(raw:unknown): SaveInspection {
  if (!isRecord(raw)) return { status:'legacy', state:hydrateGameState(raw), schemaVersion:null };
  const version = schemaVersionOf(raw);
  if (version === null) return { status:'legacy', state:hydrateGameState(raw), schemaVersion:null };
  if (!('state' in raw)) return { status:'malformed-envelope', state:hydrateGameState(null), schemaVersion:version };
  if (version === CURRENT_SAVE_SCHEMA_VERSION) {
    if (!validIntegrity(raw)) return { status:'integrity-failed', state:hydrateGameState(null), schemaVersion:version };
    return { status:'valid', state:hydrateGameState(raw.state), schemaVersion:version };
  }
  if (version === 2) {
    if (!validIntegrity(raw)) return { status:'integrity-failed', state:hydrateGameState(null), schemaVersion:version };
    return { status:'migrated-v2', state:hydrateGameState(raw.state), schemaVersion:version };
  }
  if (version === 1) return { status:'migrated-v1', state:hydrateGameState(raw.state), schemaVersion:version };
  if (version > CURRENT_SAVE_SCHEMA_VERSION) return { status:'future-version', state:hydrateGameState(raw.state), schemaVersion:version };
  return { status:'legacy', state:hydrateGameState(raw.state), schemaVersion:version };
}

export function hydrateSavedGame(raw:unknown): GameState {
  return inspectRawSavedGame(raw).state;
}

export function serializeSavedGame(state:GameState): string {
  return JSON.stringify(createSaveEnvelope(state));
}

export function inspectSavedGame(serialized:string|null|undefined): SaveInspection {
  if (!serialized) return { status:'missing', state:hydrateGameState(null), schemaVersion:null };
  try {
    return inspectRawSavedGame(JSON.parse(serialized));
  } catch {
    return { status:'invalid-json', state:hydrateGameState(null), schemaVersion:null };
  }
}

export function parseSavedGame(serialized:string|null|undefined): GameState {
  return inspectSavedGame(serialized).state;
}
