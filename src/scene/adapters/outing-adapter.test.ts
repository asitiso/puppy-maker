import {describe,expect,it} from 'vitest';
import {pickExplorationOutcome,type DiscoveryId,type OutingLocationId} from '../../adventure';
import {resolveOutingOutcome} from './outing-adapter';

describe('V14 outing scene adapter',()=>{
  it('delegates exploration outcome selection to the canonical adventure rules',()=>{
    const discoveries:DiscoveryId[]=['moon_feather'];
    const cases:Array<[OutingLocationId,number,number]>=[['forest',7,0.38],['village',12,0.62],['lakeside',3,0.2]];
    for(const [location,xp,roll] of cases){
      expect(resolveOutingOutcome(location,xp,discoveries,roll)).toEqual(pickExplorationOutcome(location,xp,discoveries,roll));
    }
  });
});
