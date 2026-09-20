import {describe,expect,it} from 'vitest';
import {createDryGrassPatch} from './environment-combat';
import {
  DAWNREACH_HERD,
  WILDLIFE_DISCOVERY_TRAIL,
  createDawnreachHerdState,
  dawnreachHerdVisual,
  dawnreachWildlifeTrailVisual,
  playerNearDawnreachHerd,
  shouldRevealWildlifeDiscoveryTrail,
  shouldWitnessDawnreachHerd,
  stepDawnreachHerd,
} from './wildlife';

describe('V18 Dawnreach wildlife ecology',()=>{
  it('moves calmly through the field without requiring player interaction',()=>{
    const herd=createDawnreachHerdState();
    const farPlayer={x:-90,y:0,z:-90};
    const moved=stepDawnreachHerd(herd,farPlayer,[],1);
    expect(moved.center.x).not.toBe(herd.center.x);
    expect(moved.center.z).not.toBe(herd.center.z);
    expect(moved.behavior).toBe('moving');
  });

  it('flees away from a nearby player and keeps alarm momentum briefly',()=>{
    const herd=createDawnreachHerdState();
    const player={x:herd.center.x-2,y:0,z:herd.center.z};
    const fleeing=stepDawnreachHerd(herd,player,[],.5);
    expect(fleeing.behavior).toBe('flee-player');
    expect(fleeing.center.x).toBeGreaterThan(herd.center.x);
    const continuing=stepDawnreachHerd(fleeing,{x:-90,y:0,z:-90},[],.5);
    expect(continuing.behavior).toBe('flee-player');
  });

  it('prioritizes escaping active fire over its normal route',()=>{
    const herd=createDawnreachHerdState();
    const fire=createDryGrassPatch('test-fire',{
      x:herd.center.x+2,
      y:herd.center.y,
      z:herd.center.z,
    },3);
    fire.burning=true;
    fire.burnRemaining=5;
    const fleeing=stepDawnreachHerd(herd,{x:-90,y:0,z:-90},[fire],.5);
    expect(fleeing.behavior).toBe('flee-fire');
    expect(fleeing.center.x).toBeLessThan(herd.center.x);
  });

  it('turns a naturally observed herd route into a temporary clue toward the hidden cave',()=>{
    const herd=createDawnreachHerdState();
    herd.center={
      x:WILDLIFE_DISCOVERY_TRAIL.origin.x,
      y:0,
      z:WILDLIFE_DISCOVERY_TRAIL.origin.z,
    };
    herd.behavior='moving';
    const player={x:55,y:0,z:20};
    expect(shouldRevealWildlifeDiscoveryTrail(player,herd,new Set())).toBe(true);
    expect(shouldRevealWildlifeDiscoveryTrail(player,herd,new Set(['hollow-cave']))).toBe(false);

    herd.behavior='flee-fire';
    expect(shouldRevealWildlifeDiscoveryTrail(player,herd,new Set())).toBe(false);

    const trail=dawnreachWildlifeTrailVisual(WILDLIFE_DISCOVERY_TRAIL.duration);
    expect(trail?.targetDiscoveryId).toBe('hollow-cave');
    expect(trail?.points.length).toBeGreaterThanOrEqual(5);
    expect(dawnreachWildlifeTrailVisual(0)).toBeNull();
  });

  it('is discovered naturally and renders as a four-member herd',()=>{
    const herd=createDawnreachHerdState();
    expect(shouldWitnessDawnreachHerd({x:80,y:0,z:80},herd,false)).toBe(false);
    expect(playerNearDawnreachHerd(herd.center,herd)).toBe(true);
    expect(shouldWitnessDawnreachHerd(herd.center,herd,false)).toBe(true);
    expect(shouldWitnessDawnreachHerd(herd.center,herd,true)).toBe(false);
    const visual=dawnreachHerdVisual(herd);
    expect(visual.id).toBe(DAWNREACH_HERD.id);
    expect(visual.members).toHaveLength(4);
    expect(visual.behavior).toBe('grazing');
  });
});
