import { hydrateGameState, type GameState } from './game';

export const CURRENT_SAVE_SCHEMA_VERSION = 1 as const;

export type GameSaveEnvelope = {
  schemaVersion: typeof CURRENT_SAVE_SCHEMA_VERSION;
  state: GameState;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value:unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const schemaVersionOf = (value:UnknownRecord) => typeof value.schemaVersion === 'number' && Number.isFinite(value.schemaVersion)
  ? Math.max(0, Math.floor(value.schemaVersion))
  : null;

export function createSaveEnvelope(state:GameState): GameSaveEnvelope {
  return { schemaVersion:CURRENT_SAVE_SCHEMA_VERSION, state };
}

function migrateLegacySave(raw:unknown): unknown {
  return raw;
}

function knownStatePayload(raw:unknown): unknown {
  if (!isRecord(raw)) return migrateLegacySave(raw);
  const version = schemaVersionOf(raw);
  if (version === null) return migrateLegacySave(raw);
  if (!('state' in raw)) return null;
  return raw.state;
}

export function hydrateSavedGame(raw:unknown): GameState {
  return hydrateGameState(knownStatePayload(raw));
}

export function serializeSavedGame(state:GameState): string {
  return JSON.stringify(createSaveEnvelope(state));
}

export function parseSavedGame(serialized:string|null|undefined): GameState {
  if (!serialized) return hydrateSavedGame(null);
  try {
    return hydrateSavedGame(JSON.parse(serialized));
  } catch {
    return hydrateSavedGame(null);
  }
}
