import {describe,expect,it} from 'vitest';
import {
  SKYBREAK_HIGHLAND,
  applySkybreakGust,
  castSkybreakWindPulse,
  createSkybreakEnemies,
  createSkybreakHighlandState,
  enterSkybreakHighland,
  playerInSkybreakGustBand,
  playerNearSkybreakBeacon,
  reachSkybreakBeacon,
  skybreakBeaconPosition,
  skybreakGustActive,
  skybreakHighlandVisual,
} from './skybreak-highland';

describe('V18 Skybreak Highland exploration pocket',()=>{
  it('starts as a transient pocket with a visible unreached beacon',()=>{
    const state=enterSkybreakHighland(createSkybreakHighlandState());
    expect(state.inside).toBe(true);
    expect(state.beaconReached).toBe(false);
    expect(skybreakHighlandVisual(state,{x:0,y:0,z:14})?.beaconReached).toBe(false);
  });

  it('uses timed gust bands that push a careless player back toward the entrance',()=>{
    const state={...enterSkybreakHighland(createSkybreakHighlandState()),gustClock:.2};
    const position={x:0,y:0,z:7};
    expect(playerInSkybreakGustBand(position)).toBe(true);
    expect(skybreakGustActive(state)).toBe(true);
    const result=applySkybreakGust(position,state,false,.1);
    expect(result.pushed).toBe(true);
    expect(result.position.z).toBeGreaterThan(position.z);
  });

  it('lets dodge ignore the gust and Wind Pulse create a temporary calm window',()=>{
    const state={...enterSkybreakHighland(createSkybreakHighlandState()),gustClock:.2};
    const position={x:0,y:0,z:7};
    expect(applySkybreakGust(position,state,true,.1).pushed).toBe(false);
    const cast=castSkybreakWindPulse(state);
    expect(cast.affected).toBe(true);
    expect(cast.state.calmClock).toBe(SKYBREAK_HIGHLAND.calmDuration);
    expect(skybreakGustActive(cast.state)).toBe(false);
  });

  it('offers a side ridge guarded by two enemies as the non-gust route',()=>{
    const enemies=createSkybreakEnemies(false);
    expect(enemies).toHaveLength(2);
    expect(enemies.every(enemy=>enemy.position.x>SKYBREAK_HIGHLAND.gustHalfWidth)).toBe(true);
    expect(createSkybreakEnemies(true)).toEqual([]);
  });

  it('turns the far landmark into the persistent wind-lift result',()=>{
    let state=enterSkybreakHighland(createSkybreakHighlandState());
    const beacon=skybreakBeaconPosition();
    expect(playerNearSkybreakBeacon(beacon,state)).toBe(true);
    state=reachSkybreakBeacon(state);
    expect(state.beaconReached).toBe(true);
    const visual=skybreakHighlandVisual(state,beacon);
    expect(visual?.windLiftOpen).toBe(true);
  });
});
