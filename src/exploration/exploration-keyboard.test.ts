import {describe,expect,it} from 'vitest';
import {explorationKeyboardIntent,isMovementKey,keyboardDirection} from './exploration-keyboard';

describe('exploration keyboard input',()=>{
  it('maps arrows and WASD to normalized movement vectors',()=>{
    expect(isMovementKey('ArrowUp')).toBe(true);
    expect(isMovementKey('KeyD')).toBe(true);
    expect(isMovementKey('Space')).toBe(false);
    expect(keyboardDirection(new Set(['KeyW']))).toEqual({x:0,y:-1});
    const diagonal=keyboardDirection(new Set(['KeyW','KeyD']));
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2);
    expect(diagonal.y).toBeCloseTo(-Math.SQRT1_2);
  });

  it('keeps movement repeatable but suppresses repeated action and exit commands',()=>{
    expect(explorationKeyboardIntent('KeyA',false)).toBe('movement');
    expect(explorationKeyboardIntent('KeyA',true)).toBe('movement');
    expect(explorationKeyboardIntent('Space',false)).toBe('action');
    expect(explorationKeyboardIntent('KeyE',false)).toBe('action');
    expect(explorationKeyboardIntent('Space',true)).toBe('none');
    expect(explorationKeyboardIntent('Escape',false)).toBe('exit');
    expect(explorationKeyboardIntent('Escape',true)).toBe('none');
    expect(explorationKeyboardIntent('Enter',false)).toBe('none');
  });

  it('keeps E available as the exploration action after focus returns to a button while preserving native Space behavior',()=>{
    const buttonTarget={closest:(selector:string)=>selector.includes('button')?{}:null};
    const inputTarget={closest:(selector:string)=>selector.includes('input')?{}:null};
    const intentWithTarget=explorationKeyboardIntent as unknown as (code:string,repeat:boolean,target:unknown)=>ReturnType<typeof explorationKeyboardIntent>;

    expect(intentWithTarget('Space',false,buttonTarget)).toBe('none');
    expect(intentWithTarget('KeyE',false,buttonTarget)).toBe('action');
    expect(intentWithTarget('KeyE',true,buttonTarget)).toBe('none');
    expect(intentWithTarget('KeyW',false,buttonTarget)).toBe('movement');
    expect(intentWithTarget('KeyW',false,inputTarget)).toBe('none');
    expect(intentWithTarget('KeyE',false,inputTarget)).toBe('none');
    expect(intentWithTarget('Space',false,inputTarget)).toBe('none');
    expect(intentWithTarget('Escape',false,inputTarget)).toBe('exit');
  });
});
