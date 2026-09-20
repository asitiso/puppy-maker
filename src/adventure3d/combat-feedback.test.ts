import {describe,expect,it} from 'vitest';
import {
  DEFAULT_COMBAT_FEEDBACK,
  combatFeedbackCamera,
  combatFeedbackTimeScale,
  pushCombatFeedback,
  stepCombatFeedback,
} from './combat-feedback';
import {DEFAULT_ADVENTURE_CAMERA} from './camera-controller';

describe('V18 combat feel feedback',()=>{
  it('adds short hit stop and floating impact events without persistence state',()=>{
    const pushed=pushCombatFeedback(DEFAULT_COMBAT_FEEDBACK,{
      kind:'guard-break',
      position:{x:1,y:2,z:3},
      amount:30,
      label:'가드 파괴',
      hitStop:.08,
      cameraImpulse:.8,
    });
    expect(pushed.events).toHaveLength(1);
    expect(pushed.hitStop).toBe(.08);
    expect(combatFeedbackTimeScale(pushed)).toBe(.12);
    expect(pushed.cameraImpulse).toBe(.8);
  });

  it('expires feedback on real time while keeping world time slowed only during hit stop',()=>{
    let state=pushCombatFeedback(DEFAULT_COMBAT_FEEDBACK,{
      kind:'hit',
      position:{x:0,y:0,z:0},
      duration:.2,
      hitStop:.04,
    });
    state=stepCombatFeedback(state,.05);
    expect(state.hitStop).toBe(0);
    expect(combatFeedbackTimeScale(state)).toBe(1);
    expect(state.events[0].remaining).toBeCloseTo(.15);
    state=stepCombatFeedback(state,.15);
    expect(state.events).toEqual([]);
  });

  it('applies render-only camera impulse without mutating the canonical camera',()=>{
    const feedback=pushCombatFeedback(DEFAULT_COMBAT_FEEDBACK,{
      kind:'counter',
      position:{x:0,y:0,z:0},
      cameraImpulse:1,
    });
    const shaken=combatFeedbackCamera(DEFAULT_ADVENTURE_CAMERA,feedback);
    expect(shaken).not.toBe(DEFAULT_ADVENTURE_CAMERA);
    expect(DEFAULT_ADVENTURE_CAMERA.yaw).toBe(0);
    expect(shaken.yaw===DEFAULT_ADVENTURE_CAMERA.yaw&&shaken.pitch===DEFAULT_ADVENTURE_CAMERA.pitch).toBe(false);
  });
});
