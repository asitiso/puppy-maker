import {describe,expect,it} from 'vitest';
import {
  WINDWALK,
  applyWindwalkGlide,
  canWindwalkGlide,
  windwalkMastered,
  windwalkUnlocked,
} from './windwalk';
import type {PlayerMotionState} from './types';

const airborne=(overrides:Partial<PlayerMotionState>={}):PlayerMotionState=>({
  position:{x:0,y:8,z:0},
  velocity:{x:0,y:-8,z:0},
  grounded:false,
  stamina:100,
  facingYaw:0,
  ...overrides,
});

describe('V18 Windwalk traversal growth',()=>{
  it('derives the unlock from the persistent Skybreak beacon result',()=>{
    expect(windwalkUnlocked(false)).toBe(false);
    expect(windwalkUnlocked(true)).toBe(true);
  });

  it('requires an unlocked falling player who is holding the glide control',()=>{
    const state=airborne();
    expect(canWindwalkGlide(state,true,true)).toBe(true);
    expect(canWindwalkGlide(state,false,true)).toBe(false);
    expect(canWindwalkGlide(state,true,false)).toBe(false);
    expect(canWindwalkGlide({...state,grounded:true},true,true)).toBe(false);
    expect(canWindwalkGlide({...state,velocity:{x:0,y:1,z:0}},true,true)).toBe(false);
  });

  it('reduces falling speed, adds forward glide and consumes stamina',()=>{
    const result=applyWindwalkGlide(airborne(),true,true,.05);
    expect(result.active).toBe(true);
    expect(result.state.velocity.y).toBe(WINDWALK.fallSpeed);
    expect(result.state.velocity.z).toBeLessThan(0);
    expect(result.state.stamina).toBeLessThan(100);
  });

  it('caps planar glide speed instead of becoming a flight exploit',()=>{
    const result=applyWindwalkGlide(
      airborne({velocity:{x:20,y:-8,z:20},facingYaw:Math.PI/2}),
      true,
      true,
      .05,
    );
    expect(Math.hypot(result.state.velocity.x,result.state.velocity.z))
      .toBeLessThanOrEqual(WINDWALK.maxPlanarSpeed+.001);
  });

  it('turns three aerial traces into lower glide stamina cost',()=>{
    expect(windwalkMastered(2)).toBe(false);
    expect(windwalkMastered(3)).toBe(true);
    const normal=applyWindwalkGlide(airborne(),true,true,.05,false);
    const mastered=applyWindwalkGlide(airborne(),true,true,.05,true);
    expect(mastered.state.stamina).toBeGreaterThan(normal.state.stamina);
  });

  it('stays referentially stable when glide is unavailable',()=>{
    const state=airborne();
    expect(applyWindwalkGlide(state,true,false,.05)).toEqual({state,active:false});
    expect(applyWindwalkGlide(state,false,true,.05)).toEqual({state,active:false});
  });
});
