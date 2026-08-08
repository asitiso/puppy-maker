import { hydrateSavedGame, serializeSavedGame } from './save-schema';
import type { GameState } from './game';

export type SaveStorage = {
  getItem(key:string): string | null;
  setItem(key:string, value:string): void;
  removeItem(key:string): void;
};

export const saveStorageKeys = {
  primary:'puppy-maker-save',
  backups:['puppy-maker-save-backup-1','puppy-maker-save-backup-2','puppy-maker-save-backup-3'] as const,
} as const;

export type SaveLoadSource = 'primary' | 'backup-1' | 'backup-2' | 'backup-3' | 'fresh';

export type ResilientSaveLoad = {
  state:GameState;
  source:SaveLoadSource;
  recovered:boolean;
};

type Candidate = { state:GameState; serialized:string };

function decodeCandidate(serialized:string|null): Candidate | null {
  if (!serialized) return null;
  try {
    const raw = JSON.parse(serialized);
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if ('schemaVersion' in raw && !('state' in raw)) return null;
    return { state:hydrateSavedGame(raw), serialized };
  } catch {
    return null;
  }
}

export function loadResilientSave(storage:SaveStorage): ResilientSaveLoad {
  const primary = decodeCandidate(storage.getItem(saveStorageKeys.primary));
  if (primary) return { state:primary.state, source:'primary', recovered:false };
  for (let index = 0; index < saveStorageKeys.backups.length; index += 1) {
    const candidate = decodeCandidate(storage.getItem(saveStorageKeys.backups[index]));
    if (candidate) return {
      state:candidate.state,
      source:`backup-${index + 1}` as SaveLoadSource,
      recovered:true,
    };
  }
  return { state:hydrateSavedGame(null), source:'fresh', recovered:false };
}

function validSerialized(storage:SaveStorage, key:string): string | null {
  const serialized = storage.getItem(key);
  return decodeCandidate(serialized)?.serialized ?? null;
}

export function writeResilientSave(storage:SaveStorage, state:GameState): void {
  const primary = validSerialized(storage, saveStorageKeys.primary);
  const backup1 = validSerialized(storage, saveStorageKeys.backups[0]);
  const backup2 = validSerialized(storage, saveStorageKeys.backups[1]);

  if (backup2) storage.setItem(saveStorageKeys.backups[2], backup2);
  if (backup1) storage.setItem(saveStorageKeys.backups[1], backup1);
  if (primary) storage.setItem(saveStorageKeys.backups[0], primary);
  storage.setItem(saveStorageKeys.primary, serializeSavedGame(state));
}

export function repairPrimarySave(storage:SaveStorage, loaded:ResilientSaveLoad): void {
  if (!loaded.recovered) return;
  storage.setItem(saveStorageKeys.primary, serializeSavedGame(loaded.state));
}
