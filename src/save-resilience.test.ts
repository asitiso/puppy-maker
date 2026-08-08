import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { serializeSavedGame } from './save-schema';
import {
  loadResilientSave,
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
    const backup1 = loadResilientSave({ ...storage, getItem:key => key === saveStorageKeys.primary ? null : storage.getItem(key) });
    expect(backup1.state.gold).toBe(100);
    expect(storage.getItem(saveStorageKeys.backups[2])).toContain('80');
  });

  it('does not promote a corrupt primary into backup history', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, '{broken');
    storage.setItem(saveStorageKeys.backups[0], serializeSavedGame({ ...initialState, gold:90 }));
    writeResilientSave(storage, { ...initialState, gold:120 });
    expect(storage.getItem(saveStorageKeys.backups[0])).toContain('90');
    expect(loadResilientSave(storage).state.gold).toBe(120);
  });
});
