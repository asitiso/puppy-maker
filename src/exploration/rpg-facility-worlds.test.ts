import {describe,expect,it} from 'vitest';
import {nearestInteractable} from './exploration-runtime';
import {
  FACILITY_SYSTEM_DESTINATION,
  rpgFacilityFeatureIds,
  rpgFacilityWorld,
} from './rpg-facility-worlds';

describe('RPG facility worlds',()=>{
  it('gives every growth management feature a distinct walkable room',()=>{
    expect(rpgFacilityFeatureIds).toEqual([
      'raising','ambition','achievements','inventory','season','sanctuary',
    ]);
    const worlds=rpgFacilityFeatureIds.map(rpgFacilityWorld);
    expect(new Set(worlds.map(world=>world.id)).size).toBe(worlds.length);
    expect(new Set(worlds.map(world=>world.label)).size).toBe(worlds.length);
  });

  it('requires movement before opening each facility system',()=>{
    for(const feature of rpgFacilityFeatureIds){
      const world=rpgFacilityWorld(feature);
      expect(nearestInteractable(world.start,world.interactables),feature).toBeNull();
      expect(world.interactables).toHaveLength(1);
      expect(world.interactables[0].kind).toBe('portal');
      expect(world.interactables[0].destinationId).toBe(FACILITY_SYSTEM_DESTINATION);
      expect(world.interactables[0].position.x).toBeGreaterThan(world.start.x);
      expect(world.start.x).toBeGreaterThan(world.playerRadius);
      expect(world.start.y).toBeGreaterThan(world.playerRadius);
      expect(world.start.x).toBeLessThan(world.width-world.playerRadius);
      expect(world.start.y).toBeLessThan(world.height-world.playerRadius);
    }
  });

  it('keeps facility presentation free of reward or progression mutations',()=>{
    const serialized=JSON.stringify(rpgFacilityFeatureIds.map(rpgFacilityWorld));
    expect(serialized).not.toMatch(/reward|goldReward|masteryGain|statDelta|dispatch|purchase/);
  });
});
