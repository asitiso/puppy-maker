import {describe,expect,it,vi} from 'vitest';
import {initialState} from './game';
import {serializeSavedGame} from './save-schema';
import {saveStorageKeys,type SaveStorage} from './save-resilience';
import {loadProductionState,writeProductionState} from './production-storage';

class MemoryStorage implements SaveStorage {
  data=new Map<string,string>();
  getItem(key:string){return this.data.get(key)??null;}
  setItem(key:string,value:string){this.data.set(key,value);}
  removeItem(key:string){this.data.delete(key);}
}

describe('production storage safety',()=>{
  it('falls back to a fresh in-memory state when browser storage reads throw',()=>{
    const storage:SaveStorage={
      getItem(){throw new Error('blocked');},
      setItem(){throw new Error('blocked');},
      removeItem(){throw new Error('blocked');},
    };
    const report=vi.fn();
    expect(loadProductionState(storage,report)).toEqual(initialState);
    expect(report).toHaveBeenCalledWith('save_error','load');
  });

  it('keeps writes non-fatal when browser storage throws',()=>{
    const storage:SaveStorage={
      getItem(){return null;},
      setItem(){throw new Error('blocked');},
      removeItem(){throw new Error('blocked');},
    };
    const report=vi.fn();
    expect(()=>writeProductionState(storage,initialState,report)).not.toThrow();
    expect(report).toHaveBeenCalledWith('save_error','write');
  });

  it('preserves the canonical resilient save path when storage works',()=>{
    const storage=new MemoryStorage();
    storage.setItem(saveStorageKeys.primary,serializeSavedGame({...initialState,gold:777}));
    const report=vi.fn();
    expect(loadProductionState(storage,report).gold).toBe(777);
    expect(report).not.toHaveBeenCalled();
  });
});
