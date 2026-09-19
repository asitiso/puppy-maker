import {describe,expect,it} from 'vitest';
import {nearestStartingFieldDiscovery,STARTING_FIELD,startingFieldHeight,visibleStartingLandmarks} from './starting-field';

describe('V18 starting field exploration density',()=>{
  it('shows three competing landmarks from the opening field instead of one forced route',()=>{
    const landmarks=visibleStartingLandmarks();
    expect(landmarks.map(item=>item.id)).toEqual(['skywatch','echo-ruins','ember-camp']);
    expect(new Set(landmarks.map(item=>Math.sign(item.position.x))).size).toBeGreaterThan(1);
    expect(landmarks.every(item=>item.position.z<STARTING_FIELD.spawn.z)).toBe(true);
  });

  it('starts outside interaction range so the first action is movement and observation',()=>{
    expect(nearestStartingFieldDiscovery(STARTING_FIELD.spawn.x,STARTING_FIELD.spawn.z,new Set())).toBeNull();
  });

  it('provides dense optional discoveries between major destinations',()=>{
    expect(STARTING_FIELD.discoveries.length).toBeGreaterThanOrEqual(9);
    const optional=STARTING_FIELD.discoveries.filter(item=>item.importance<3);
    expect(optional.length).toBeGreaterThanOrEqual(6);
    expect(new Set(optional.map(item=>item.kind)).size).toBeGreaterThanOrEqual(5);
  });

  it('makes the lookout a genuinely higher observation point',()=>{
    const vista=STARTING_FIELD.discoveries.find(item=>item.id==='skywatch')!;
    expect(startingFieldHeight(vista.position.x,vista.position.z)).toBeGreaterThan(10);
    expect(startingFieldHeight(STARTING_FIELD.spawn.x,STARTING_FIELD.spawn.z)).toBeLessThan(1);
  });

  it('does not encode A to B to C prerequisites into the field data',()=>{
    const serialized=JSON.stringify(STARTING_FIELD);
    expect(serialized).not.toMatch(/requires|prerequisite|nextStep|questArrow/);
  });
});
