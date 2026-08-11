import { describe,expect,it } from 'vitest';
import { initialState } from '../game';
import { MEMORY_CATALOG,hasMemory,unlockMemory } from './memories';
describe('Runa memories',()=>{it('has metadata for every stable memory id',()=>expect(Object.keys(MEMORY_CATALOG)).toHaveLength(6));it('unlocks a memory only once',()=>{const once=unlockMemory(initialState,'first_training');const twice=unlockMemory(once,'first_training');expect(hasMemory(twice,'first_training')).toBe(true);expect(twice.memories.filter(m=>m.id==='first_training')).toHaveLength(1);});});