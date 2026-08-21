import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { CURRENT_SAVE_SCHEMA_VERSION, parseSavedGame, serializeSavedGame } from './save-schema';
import {
  loadResilientSave,
  repairPrimarySave,
  saveStorageKeys,
  writeResilientSave,
  type SaveStorage,
} from './save-resilience';

class MemoryStorage implements SaveStorage {
  private data = new Map<string,string>();
  getItem(key:string) { return this.data.get(key) ?? null; }
  setItem(key:string, value:string) { this.data.set(key, value); }
  removeItem(key:string) { this.data.delete(key); }
}

function futureSave(gold:number) {
  return JSON.stringify({
    schemaVersion:CURRENT_SAVE_SCHEMA_VERSION + 1,
    integrity:'future-integrity-format-is-opaque-to-this-version',
    state:{ ...initialState, gold, unknownFutureField:{ keep:true } },
  });
}

describe('save resilience', () => {
  it('loads the primary save when it is valid', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, serializeSavedGame({ ...initialState, gold:777 }));
    const result = loadResilientSave(storage);
    expect(result.source).toBe('primary');
    expect(result.recovered).toBe(false);
    expect(result.state.gold).toBe(777);
  });

  it('recovers from the newest valid backup when the primary save is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, '{broken');
    storage.setItem(saveStorageKeys.backups[0], serializeSavedGame({ ...initialState, gold:555 }));
    storage.setItem(saveStorageKeys.backups[1], serializeSavedGame({ ...initialState, gold:444 }));
    const result = loadResilientSave(storage);
    expect(result.source).toBe('backup-1');
    expect(result.recovered).toBe(true);
    expect(result.state.gold).toBe(555);
  });

  it('skips corrupt backups and falls through to an older valid generation', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, 'not-json');
    storage.setItem(saveStorageKeys.backups[0], '{bad');
    storage.setItem(saveStorageKeys.backups[1], serializeSavedGame({ ...initialState, gems:9 }));
    const result = loadResilientSave(storage);
    expect(result.source).toBe('backup-2');
    expect(result.state.gems).toBe(9);
  });

  it('rotates three valid generations before writing a new primary save', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, serializeSavedGame({ ...initialState, gold:100 }));
    storage.setItem(saveStorageKeys.backups[0], serializeSavedGame({ ...initialState, gold:90 }));
    storage.setItem(saveStorageKeys.backups[1], serializeSavedGame({ ...initialState, gold:80 }));
    storage.setItem(saveStorageKeys.backups[2], serializeSavedGame({ ...initialState, gold:70 }));
    writeResilientSave(storage, { ...initialState, gold:110 });
    expect(loadResilientSave(storage).state.gold).toBe(110);
    expect(parseSavedGame(storage.getItem(saveStorageKeys.backups[0])).gold).toBe(100);
    expect(parseSavedGame(storage.getItem(saveStorageKeys.backups[1])).gold).toBe(90);
    expect(parseSavedGame(storage.getItem(saveStorageKeys.backups[2])).gold).toBe(80);
  });

  it('does not promote a corrupt primary into backup history', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, '{broken');
    storage.setItem(saveStorageKeys.backups[0], serializeSavedGame({ ...initialState, gold:90 }));
    writeResilientSave(storage, { ...initialState, gold:120 });
    expect(parseSavedGame(storage.getItem(saveStorageKeys.backups[0])).gold).toBe(90);
    expect(loadResilientSave(storage).state.gold).toBe(120);
  });

  it('keeps a future-version primary byte-for-byte intact instead of downgrading it on autosave', () => {
    const storage = new MemoryStorage();
    const future = futureSave(999);
    storage.setItem(saveStorageKeys.primary, future);

    const loaded = loadResilientSave(storage);
    expect(loaded.source).toBe('primary');
    expect(loaded.state.gold).toBe(999);

    writeResilientSave(storage, { ...loaded.state, gold:1000 });

    expect(storage.getItem(saveStorageKeys.primary)).toBe(future);
    expect(storage.getItem(saveStorageKeys.backups[0])).toBeNull();
  });

  it('does not repair a future-version backup into a lossy current-schema primary', () => {
    const storage = new MemoryStorage();
    const future = futureSave(888);
    storage.setItem(saveStorageKeys.primary, '{broken');
    storage.setItem(saveStorageKeys.backups[0], future);

    const loaded = loadResilientSave(storage);
    expect(loaded.source).toBe('backup-1');
    expect(loaded.recovered).toBe(true);
    expect(loaded.state.gold).toBe(888);

    repairPrimarySave(storage, loaded);

    expect(storage.getItem(saveStorageKeys.primary)).toBe('{broken');
    expect(storage.getItem(saveStorageKeys.backups[0])).toBe(future);
  });
});