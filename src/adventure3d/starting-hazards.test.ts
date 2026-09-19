import {describe,expect,it} from 'vitest';
import {createStartingCampHazards} from './starting-hazards';
import {STARTING_FIELD} from './starting-field';

describe('V18 starting camp environment hazards',()=>{
  it('places burnable grass around the enemy camp rather than across the entire field',()=>{
    const camp=STARTING_FIELD.discoveries.find(item=>item.id==='ember-camp')!;
    const hazards=createStartingCampHazards();
    expect(hazards).toHaveLength(3);
    for(const hazard of hazards){
      expect(hazard.material).toBe('dryGrass');
      expect(Math.hypot(hazard.position.x-camp.position.x,hazard.position.z-camp.position.z)).toBeLessThan(12);
      expect(Math.hypot(hazard.position.x-STARTING_FIELD.spawn.x,hazard.position.z-STARTING_FIELD.spawn.z)).toBeGreaterThan(55);
    }
  });
});
