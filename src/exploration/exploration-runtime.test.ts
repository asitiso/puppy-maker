import {describe,expect,it} from 'vitest';
import {cameraForPlayer,interactionIsUnlocked,moveWithCollisions,nearestInteractable,normalizeDirection} from './exploration-runtime';
import type {ExplorationInteractable,ExplorationWorldDefinition} from './exploration-types';

const world:ExplorationWorldDefinition={
  id:'runtime-test',
  label:'Runtime Test',
  objective:'Move through the world',
  width:1000,
  height:800,
  playerRadius:16,
  playerSpeed:220,
  start:{x:100,y:100},
  obstacles:[{id:'rock',x:180,y:60,width:80,height:160}],
  interactables:[],
  layers:[],
};

describe('mobile exploration runtime',()=>{
  it('normalizes diagonal movement so it is not faster than cardinal movement',()=>{
    const direction=normalizeDirection({x:1,y:1});
    expect(direction.x).toBeCloseTo(Math.SQRT1_2,6);
    expect(direction.y).toBeCloseTo(Math.SQRT1_2,6);
    expect(Math.hypot(direction.x,direction.y)).toBeCloseTo(1,6);
  });

  it('keeps the player inside world bounds and slides along obstacles axis by axis',()=>{
    expect(moveWithCollisions({x:20,y:20},{x:-40,y:0},world)).toEqual({x:16,y:20});
    expect(moveWithCollisions({x:150,y:120},{x:80,y:40},world)).toEqual({x:150,y:160});
  });

  it('centers the camera on the player and clamps it at world edges',()=>{
    expect(cameraForPlayer({x:500,y:400},world,{width:390,height:844})).toEqual({x:305,y:0});
    expect(cameraForPlayer({x:990,y:790},world,{width:390,height:300})).toEqual({x:610,y:500});
    expect(cameraForPlayer({x:10,y:10},world,{width:390,height:300})).toEqual({x:0,y:0});
  });

  it('selects the nearest enabled interactable inside its radius',()=>{
    const items:ExplorationInteractable[]=[
      {id:'far',label:'Far',kind:'inspect',position:{x:180,y:100},radius:120},
      {id:'tracks',label:'Tracks',kind:'story',position:{x:120,y:100},radius:60,storyFrameId:'tracks'},
      {id:'disabled',label:'Disabled',kind:'story',position:{x:105,y:100},radius:60,storyFrameId:'disabled',enabled:false},
    ];
    expect(nearestInteractable({x:100,y:100},items)?.id).toBe('tracks');
    expect(nearestInteractable({x:400,y:400},items)).toBeNull();
  });

  it('unlocks later discoveries only after every authored prerequisite is completed',()=>{
    const first:ExplorationInteractable={id:'first',label:'First clue',kind:'story',position:{x:0,y:0},radius:60};
    const second:ExplorationInteractable={id:'second',label:'Second clue',kind:'story',position:{x:0,y:0},radius:60,requiresCompleted:['first']};
    const finale:ExplorationInteractable={id:'finale',label:'Final clue',kind:'story',position:{x:0,y:0},radius:60,requiresCompleted:['first','second']};
    expect(interactionIsUnlocked(first,new Set())).toBe(true);
    expect(interactionIsUnlocked(second,new Set())).toBe(false);
    expect(interactionIsUnlocked(second,new Set(['first']))).toBe(true);
    expect(interactionIsUnlocked(finale,new Set(['first']))).toBe(false);
    expect(interactionIsUnlocked(finale,new Set(['first','second']))).toBe(true);
  });
});
