import {normalizeDirection} from './exploration-runtime';
import type {Vec2} from './exploration-types';

const MOVEMENT_KEYS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);
const ACTION_KEYS=new Set(['Space','KeyE']);

export type ExplorationKeyboardIntent='movement'|'action'|'exit'|'none';

export function isMovementKey(code:string):boolean{
  return MOVEMENT_KEYS.has(code);
}

export function explorationKeyboardIntent(code:string,repeat:boolean):ExplorationKeyboardIntent{
  if(isMovementKey(code)) return 'movement';
  if(repeat) return 'none';
  if(ACTION_KEYS.has(code)) return 'action';
  if(code==='Escape') return 'exit';
  return 'none';
}

export function keyboardDirection(keys:ReadonlySet<string>):Vec2{
  const x=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
  const y=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  return normalizeDirection({x,y});
}
