import { describe,expect,it } from 'vitest';
import { initialState } from '../game';
import { deserializeSave,serializeSave } from './save-v2';
describe('save v2',()=>{it('round trips current progress',()=>{const state={...initialState,gold:8123,monthsCompleted:7};expect(deserializeSave(serializeSave(state))).toMatchObject({gold:8123,monthsCompleted:7})});it('loads legacy unversioned saves',()=>{expect(deserializeSave(JSON.stringify({...initialState,gold:6543})).gold).toBe(6543)});it('falls back safely for broken data',()=>{expect(deserializeSave('{oops')).toEqual(initialState)})});
