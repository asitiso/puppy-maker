import {normalizeDirection} from './exploration-runtime';
import type {Vec2} from './exploration-types';

const MOVEMENT_KEYS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD']);
const ACTION_KEYS=new Set(['Space','KeyE']);
const TYPING_TARGET_SELECTOR='input,textarea,select,[contenteditable="true"]';
const CONTROL_TARGET_SELECTOR='button,a[href],[role="button"]';

export type ExplorationKeyboardIntent='movement'|'action'|'exit'|'none';

type KeyboardEventTarget={closest?:(selector:string)=>unknown};

export function isMovementKey(code:string):boolean{
  return MOVEMENT_KEYS.has(code);
}

function targetMatches(target:unknown,selector:string):boolean{
  return Boolean(target&&typeof target==='object'&&typeof (target as KeyboardEventTarget).closest==='function'&&(target as KeyboardEventTarget).closest?.(selector));
}

export function explorationKeyboardIntent(code:string,repeat:boolean,target?:unknown):ExplorationKeyboardIntent{
  const typingTarget=targetMatches(target,TYPING_TARGET_SELECTOR);
  if(code==='Escape') return repeat?'none':'exit';
  if(typingTarget) return 'none';
  if(isMovementKey(code)) return 'movement';
  if(repeat) return 'none';
  if(code==='KeyE') return 'action';
  if(code==='Space') return targetMatches(target,CONTROL_TARGET_SELECTOR)?'none':'action';
  return 'none';
}

export function keyboardDirection(keys:ReadonlySet<string>):Vec2{
  const x=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
  const y=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
  return normalizeDirection({x,y});
}
