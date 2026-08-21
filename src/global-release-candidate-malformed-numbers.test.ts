import { describe, expect, it } from 'vitest';
import { hydrateGameState, initialState, reducer, type GameState } from './game';

type Path = Array<string|number>;

function cloneValue<T>(value:T):T {
  if (Array.isArray(value)) return value.map(item=>cloneValue(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[key,cloneValue(item)])) as T;
  }
  return value;
}

function numericPaths(value:unknown,path:Path=[]):Path[] {
  if (typeof value === 'number') return [path];
  if (Array.isArray(value)) return value.flatMap((item,index)=>numericPaths(item,[...path,index]));
  if (value && typeof value === 'object') return Object.entries(value as Record<string,unknown>).flatMap(([key,item])=>numericPaths(item,[...path,key]));
  return [];
}

function setAtPath(root:unknown,path:Path,value:unknown) {
  let cursor = root as any;
  for (let index=0; index<path.length-1; index+=1) cursor = cursor[path[index]];
  cursor[path[path.length-1]] = value;
}

function assertFiniteTree(value:unknown,path='state') {
  if (typeof value === 'number') {
    expect(Number.isFinite(value),`${path} should be finite but was ${String(value)}`).toBe(true);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item,index)=>assertFiniteTree(item,`${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key,item] of Object.entries(value as Record<string,unknown>)) assertFiniteTree(item,`${path}.${key}`);
  }
}

function progressedState():GameState {
  let state = reducer(initialState,{ type:'FINISH_EXPEDITION_STAGE', stageId:'forest_path', score:900 });
  state = reducer(state,{ type:'SET_TACTICAL_PARTY', companions:['bear','owl'] });
  state = reducer(state,{ type:'COMPLETE_TACTICAL_BATTLE', encounterId:'training_ground', result:'victory', rounds:4, survivingAllies:3, damageTaken:40, companions:['bear','owl'] });
  return {
    ...state,
    monthsCompleted:4,
    monthlyCounters:{ trainings:2,outings:1,gifts:1 },
    seasonStamps:['spring'],
  };
}

describe('global release candidate malformed numeric hydration sweep', () => {
  it('never emits NaN or Infinity when any persisted numeric leaf is corrupted', () => {
    const source = progressedState();
    const paths = numericPaths(source);
    expect(paths.length).toBeGreaterThan(25);
    for (const path of paths) {
      for (const malformed of [Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]) {
        const corrupt = cloneValue(source);
        setAtPath(corrupt,path,malformed);
        const hydrated = hydrateGameState(corrupt);
        assertFiniteTree(hydrated);
      }
    }
  });
});
