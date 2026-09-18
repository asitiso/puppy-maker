import {describe,expect,it} from 'vitest';
import type {MobileContentCategory} from '../mobile-router';
import {districtFeatureIds,parseDistrictFeature,rpgDistrictWorld} from './rpg-district-worlds';
import {nearestInteractable} from './exploration-runtime';

const categories:MobileContentCategory[]=['life','growth','adventure','bond','records'];

describe('RPG district worlds',()=>{
  it('maps every category feature to one physical portal',()=>{
    for(const category of categories){
      const world=rpgDistrictWorld(category);
      const portals=world.interactables.filter(item=>item.kind==='portal');
      expect(portals).toHaveLength(districtFeatureIds[category].length);
      expect(portals.map(item=>parseDistrictFeature(item.destinationId??''))).toEqual([...districtFeatureIds[category]]);
    }
  });

  it('starts every district in neutral walkable space away from facility portals',()=>{
    for(const category of categories){
      const world=rpgDistrictWorld(category);
      expect(nearestInteractable(world.start,world.interactables),category).toBeNull();
      expect(world.start.x).toBeGreaterThan(world.playerRadius);
      expect(world.start.y).toBeGreaterThan(world.playerRadius);
      expect(world.start.x).toBeLessThan(world.width-world.playerRadius);
      expect(world.start.y).toBeLessThan(world.height-world.playerRadius);
    }
  });

  it('keeps authored facility interaction zones distinct',()=>{
    for(const category of categories){
      const portals=rpgDistrictWorld(category).interactables;
      for(let a=0;a<portals.length;a+=1){
        for(let b=a+1;b<portals.length;b+=1){
          const left=portals[a];
          const right=portals[b];
          const distance=Math.hypot(left.position.x-right.position.x,left.position.y-right.position.y);
          expect(distance,`${category}: ${left.id} overlaps ${right.id}`).toBeGreaterThan(left.radius+right.radius+20);
        }
      }
    }
  });

  it('rejects unknown district destinations',()=>{
    expect(parseDistrictFeature('feature:not-real')).toBeNull();
    expect(parseDistrictFeature('portal:outing')).toBeNull();
  });
});
