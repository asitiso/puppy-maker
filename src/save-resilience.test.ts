import { describe, expect, it } from 'vitest';
import { initialState } from './game';
import { parseSavedGame, serializeSavedGame } from './save-schema';
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

function integrityForTest(state:unknown):string{
  const serialized=JSON.stringify(state);
  let hash=0x811c9dc5;
  for(let index=0;index<serialized.length;index+=1){
    hash^=serialized.charCodeAt(index);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

function v2State(gold=444){
  const {campaignRun,worldHistory,characterBonds,legacy,...state}=initialState;
  void campaignRun;void worldHistory;void characterBonds;void legacy;
  return {...state,gold,endingCollection:['guardian']};
}

function serializeV2(state:ReturnType<typeof v2State>):string{
  return JSON.stringify({schemaVersion:2,integrity:integrityForTest(state),state});
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

  it('accepts a valid v2 backup when the primary is corrupt',()=>{
    const storage=new MemoryStorage();
    const state=v2State();
    storage.setItem(saveStorageKeys.primary,'{broken');
    storage.setItem(saveStorageKeys.backups[0],serializeV2(state));
    const result=loadResilientSave(storage);
    expect(result.source).toBe('backup-1');
    expect(result.recovered).toBe(true);
    expect(result.state.gold).toBe(444);
    expect(result.state.campaignRun.phase).toBe('spring_exploration');
  });

  it('skips a tampered v2 backup',()=>{
    const storage=new MemoryStorage();
    const state=v2State();
    const envelope={schemaVersion:2,integrity:integrityForTest(state),state};
    envelope.state.gold=999999;
    storage.setItem(saveStorageKeys.backups[0],JSON.stringify(envelope));
    expect(loadResilientSave(storage).source).toBe('fresh');
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

  it('rotates a valid v2 primary and writes a schema 3 primary',()=>{
    const storage=new MemoryStorage();
    storage.setItem(saveStorageKeys.primary,serializeV2(v2State(100)));
    writeResilientSave(storage,{...initialState,gold:120});
    expect(JSON.parse(storage.getItem(saveStorageKeys.primary)!).schemaVersion).toBe(3);
    expect(parseSavedGame(storage.getItem(saveStorageKeys.backups[0])).gold).toBe(100);
  });

  it('does not promote a corrupt primary into backup history', () => {
    const storage = new MemoryStorage();
    storage.setItem(saveStorageKeys.primary, '{broken');
    storage.setItem(saveStorageKeys.backups[0], serializeSavedGame({ ...initialState, gold:90 }));
    writeResilientSave(storage, { ...initialState, gold:120 });
    expect(parseSavedGame(storage.getItem(saveStorageKeys.backups[0])).gold).toBe(90);
    expect(loadResilientSave(storage).state.gold).toBe(120);
  });
});
