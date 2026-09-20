import {describe,expect,it} from 'vitest';
import {
  WANDERING_CARAVAN,
  createWanderingCaravanState,
  playerNearWanderingCaravan,
  shouldWitnessWanderingCaravan,
  stepWanderingCaravan,
  wanderingCaravanMessage,
  wanderingCaravanVisual,
} from './roaming-world';

describe('V18 roaming world presence',()=>{
  it('moves through the field without waiting for the player',()=>{
    const start=createWanderingCaravanState();
    const moved=stepWanderingCaravan(start,1);
    expect(moved.position.x).not.toBe(start.position.x);
    expect(moved.position.z).not.toBe(start.position.z);
    expect(moved.targetIndex).toBe(start.targetIndex);
  });

  it('pauses near the player so interaction does not become a chase',()=>{
    const start=createWanderingCaravanState();
    expect(stepWanderingCaravan(start,1,true)).toBe(start);
    expect(playerNearWanderingCaravan(start.position,start)).toBe(true);
  });

  it('only announces the roaming presence when naturally witnessed',()=>{
    const caravan=createWanderingCaravanState();
    const near={...caravan.position};
    const far={x:80,y:0,z:80};
    expect(shouldWitnessWanderingCaravan(far,caravan,false)).toBe(false);
    expect(shouldWitnessWanderingCaravan(near,caravan,false)).toBe(true);
    expect(shouldWitnessWanderingCaravan(near,caravan,true)).toBe(false);
  });

  it('keeps movement transient while familiarity is expressed by the saved meeting outcome',()=>{
    const caravan=createWanderingCaravanState();
    expect(wanderingCaravanVisual(caravan,false,false)).toMatchObject({
      id:WANDERING_CARAVAN.id,
      label:'들판 행상인',
      familiar:false,
    });
    expect(wanderingCaravanVisual(caravan,true,true)).toMatchObject({
      label:'아는 행상인',
      familiar:true,
      nearby:true,
    });
    expect(wanderingCaravanMessage(false,'rescued')).toContain('길목');
    expect(wanderingCaravanMessage(false,'passed')).toContain('버려진 짐');
    expect(wanderingCaravanMessage(true,'met')).toContain('또 만났네요');
  });
});
