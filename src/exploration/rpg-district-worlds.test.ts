import {describe,expect,it} from 'vitest';
import type {MobileContentCategory} from '../mobile-router';
import {districtFeatureIds,districtForFeature,nextDistrictToward,parseDistrictDestination,parseDistrictFeature,rpgDistrictWorld} from './rpg-district-worlds';
import {nearestInteractable} from './exploration-runtime';

const categories:MobileContentCategory[]=['life','growth','adventure','bond','records'];

describe('RPG district worlds',()=>{
  it('maps every category feature to one physical facility portal, one quest NPC and two world gates',()=>{
    for(const category of categories){
      const world=rpgDistrictWorld(category);
      const facilities=world.interactables.filter(item=>parseDistrictDestination(item.destinationId??'')?.kind==='feature');
      const districtGates=world.interactables.filter(item=>parseDistrictDestination(item.destinationId??'')?.kind==='district');
      const questNpcs=world.interactables.filter(item=>parseDistrictDestination(item.destinationId??'')?.kind==='questNpc');
      expect(facilities).toHaveLength(districtFeatureIds[category].length);
      expect(facilities.map(item=>parseDistrictFeature(item.destinationId??''))).toEqual([...districtFeatureIds[category]]);
      expect(districtGates).toHaveLength(2);
      expect(questNpcs).toHaveLength(1);
      expect(questNpcs[0].id).toBe(`district-quest-npc:${category}`);
      expect(questNpcs[0].label).not.toMatch(/^[!?·] /);
      expect(questNpcs[0].artSrc).toMatch(/\/assets\/exploration\/(quest-npcs|village\/npcs)\//);
      expect(questNpcs[0].badge).toBe('!');
      expect(questNpcs[0].badgeTone).toBe('quest');
    }
  });

  it('forms a bidirectional ring so every district can be traversed without returning home',()=>{
    const adjacency=new Map<MobileContentCategory,Set<MobileContentCategory>>();
    for(const category of categories){
      const destinations=rpgDistrictWorld(category).interactables
        .map(item=>parseDistrictDestination(item.destinationId??''))
        .filter((item):item is {kind:'district';category:MobileContentCategory}=>item?.kind==='district')
        .map(item=>item.category);
      adjacency.set(category,new Set(destinations));
      expect(new Set(destinations).size).toBe(2);
      expect(destinations).not.toContain(category);
    }
    for(const [from,targets] of adjacency){
      for(const to of targets)expect(adjacency.get(to),`${from} -> ${to} must have a return route`).toContain(from);
    }
    const visited=new Set<MobileContentCategory>();
    const queue:MobileContentCategory[]=['life'];
    while(queue.length){
      const current=queue.shift()!;
      if(visited.has(current))continue;
      visited.add(current);
      for(const next of adjacency.get(current)??[])queue.push(next);
    }
    expect(visited).toEqual(new Set(categories));
  });

  it('routes global objectives through the shortest next district gate',()=>{
    expect(nextDistrictToward('life','life')).toBeNull();
    expect(nextDistrictToward('life','growth')).toBe('growth');
    expect(nextDistrictToward('life','records')).toBe('records');
    expect(nextDistrictToward('life','adventure')).toBe('growth');
    expect(nextDistrictToward('adventure','records')).toBe('bond');
    expect(districtForFeature('achievements')).toBe('growth');
    expect(districtForFeature('world_chronicle')).toBe('records');
  });

  it('starts every district in neutral walkable space away from all portals',()=>{
    for(const category of categories){
      const world=rpgDistrictWorld(category);
      expect(nearestInteractable(world.start,world.interactables),category).toBeNull();
      expect(world.start.x).toBeGreaterThan(world.playerRadius);
      expect(world.start.y).toBeGreaterThan(world.playerRadius);
      expect(world.start.x).toBeLessThan(world.width-world.playerRadius);
      expect(world.start.y).toBeLessThan(world.height-world.playerRadius);
    }
  });

  it('keeps authored interaction zones distinct',()=>{
    for(const category of categories){
      const portals=rpgDistrictWorld(category).interactables;
      for(let a=0;a<portals.length;a+=1){
        for(let b=a+1;b<portals.length;b+=1){
          const left=portals[a],right=portals[b];
          const distance=Math.hypot(left.position.x-right.position.x,left.position.y-right.position.y);
          expect(distance,`${category}: ${left.id} overlaps ${right.id}`).toBeGreaterThan(left.radius+right.radius+20);
        }
      }
    }
  });

  it('parses valid world travel and rejects unknown destinations',()=>{
    expect(parseDistrictDestination('district:adventure')).toEqual({kind:'district',category:'adventure'});
    expect(parseDistrictDestination('feature:outing')).toEqual({kind:'feature',feature:'outing'});
    expect(parseDistrictDestination('quest-npc:bond')).toEqual({kind:'questNpc',category:'bond'});
    expect(parseDistrictDestination('district:not-real')).toBeNull();
    expect(parseDistrictFeature('district:life')).toBeNull();
    expect(parseDistrictFeature('feature:not-real')).toBeNull();
    expect(parseDistrictDestination('portal:outing')).toBeNull();
  });
});
