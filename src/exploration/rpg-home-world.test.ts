import {describe,expect,it} from 'vitest';
import {nearestInteractable} from './exploration-runtime';
import {HOME_HUB_DESTINATIONS,rpgHomeWorld} from './rpg-home-world';

function distanceToRect(point:{x:number;y:number},rect:{x:number;y:number;width:number;height:number}):number{
  const x=Math.min(rect.x+rect.width,Math.max(rect.x,point.x));
  const y=Math.min(rect.y+rect.height,Math.max(rect.y,point.y));
  return Math.hypot(point.x-x,point.y-y);
}

describe('RPG home world',()=>{
  it('exposes six spatial destinations that cover the core raising loop',()=>{
    const portals=rpgHomeWorld.interactables.filter(item=>item.kind==='portal');
    expect(portals).toHaveLength(6);
    expect(portals.map(item=>item.destinationId)).toEqual([
      HOME_HUB_DESTINATIONS.life,
      HOME_HUB_DESTINATIONS.growth,
      HOME_HUB_DESTINATIONS.outing,
      HOME_HUB_DESTINATIONS.expedition,
      HOME_HUB_DESTINATIONS.bond,
      HOME_HUB_DESTINATIONS.records,
    ]);
    expect(new Set(portals.map(item=>item.destinationId)).size).toBe(portals.length);
  });

  it('starts in walkable neutral space instead of on top of a menu destination',()=>{
    expect(nearestInteractable(rpgHomeWorld.start,rpgHomeWorld.interactables)).toBeNull();
    expect(rpgHomeWorld.start.x).toBeGreaterThan(rpgHomeWorld.playerRadius);
    expect(rpgHomeWorld.start.y).toBeGreaterThan(rpgHomeWorld.playerRadius);
    for(const obstacle of rpgHomeWorld.obstacles){
      expect(distanceToRect(rpgHomeWorld.start,obstacle),obstacle.id).toBeGreaterThan(rpgHomeWorld.playerRadius);
    }
  });

  it('keeps destination interaction zones readable and physically reachable',()=>{
    const portals=rpgHomeWorld.interactables.filter(item=>item.kind==='portal');
    for(const portal of portals){
      for(const obstacle of rpgHomeWorld.obstacles){
        expect(distanceToRect(portal.position,obstacle),`${portal.id} overlaps ${obstacle.id}`).toBeGreaterThan(rpgHomeWorld.playerRadius);
      }
    }
    for(let a=0;a<portals.length;a+=1){
      for(let b=a+1;b<portals.length;b+=1){
        const left=portals[a];
        const right=portals[b];
        const distance=Math.hypot(left.position.x-right.position.x,left.position.y-right.position.y);
        expect(distance,`${left.id} overlaps ${right.id}`).toBeGreaterThan(left.radius+right.radius+20);
      }
    }
  });
});
